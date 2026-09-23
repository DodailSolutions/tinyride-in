# TinyRide — Production Operational Runbooks

**Company:** Dodail Solutions Private Limited  
**Operational Headquarters:** Hyderabad, Telangana, India  
**Emergency Central Dispatch:** `+91 40 8899 0011`  

---

## Runbook 1: Database Backup & Point-In-Time Recovery (PITR)

### 1.1. Automated Backup Cadence
- **Continuous Archival:** Write-Ahead Logging (WAL) continuously streamed to AWS S3 Mumbai (`ap-south-1`) with a 30-day retention window.
- **Daily Logical Snapshot:** Full `pg_dump` executed daily at 02:00 IST during the maintenance window:
  ```bash
  pg_dump -Fc --no-acl --no-owner -h "$DB_HOST" -U postgres -d postgres > "tinyride_backup_$(date +%Y%m%d).dump"
  aws s3 cp "tinyride_backup_$(date +%Y%m%d).dump" s3://tinyride-backups-mumbai/logical/
  ```

### 1.2. Disaster Recovery Restore Procedure
1. In the event of catastrophic data corruption or unrecoverable error, identify recovery target timestamp (e.g. `2026-06-01 14:30:00+05:30`).
2. Halt incoming API traffic by setting maintenance mode on AWS ALB.
3. Provision new PostgreSQL cluster and execute point-in-time recovery via Supabase Dashboard or pgBackRest.
4. Verify database invariants before re-enabling traffic:
   ```sql
   -- Verify ledger balanced
   SELECT SUM(amount_minor) FROM public.ledger_entries; -- Must equal 0
   -- Verify seat hold counters match reservations
   SELECT * FROM public.schedule_seat_counters WHERE seats_taken > seats_offered; -- Must return 0 rows
   ```

---

## Runbook 2: Automated Scheduled Jobs (`pg_cron`)

The platform relies on `pg_cron` extensions configured in `sql/00_roles_and_extensions.sql`:

### 2.1. Expired Seat Hold Sweep (Every 5 Minutes)
```sql
SELECT cron.schedule('sweep_expired_seat_holds', '*/5 * * * *', $$
  DELETE FROM public.seat_holds
  WHERE expires_at < NOW() AND converted_to_booking_id IS NULL;
$$);
```
- **Operational Verification:** If seat holds fail to clear, run manual trigger:
  `DELETE FROM public.seat_holds WHERE expires_at < NOW() AND converted_to_booking_id IS NULL;`

### 2.2. Next-Day Trip Generation (Daily at 18:00 IST)
```sql
SELECT cron.schedule('generate_next_day_trips', '0 18 * * *', $$
  SELECT app.generate_trips_for_date(CURRENT_DATE + INTERVAL '1 day');
$$);
```
- **Operator Action:** At 18:30 IST, Central Operations verifies tomorrow's manifest counts on `/admin/ops/overview`.

### 2.3. Nightly Double-Entry Ledger Reconciliation (Daily at 23:59 IST)
```sql
SELECT cron.schedule('nightly_ledger_audit', '59 23 * * *', $$
  INSERT INTO public.reconciliation_logs (audit_date, discrepancy_paise, status)
  SELECT CURRENT_DATE, COALESCE(SUM(amount_minor), 0),
         CASE WHEN COALESCE(SUM(amount_minor), 0) = 0 THEN 'BALANCED' ELSE 'DISCREPANCY_ALERT' END
  FROM public.ledger_entries;
$$);
```

---

## Runbook 3: Safety Exception & SOS Emergency Dispatch Escalation

### 3.1. Severity Tiers & SLA Timers

| Severity | Incident Type | SLA Countdown | Initial Escalation Action |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Parent SOS Trigger / 3-Attempt OTP Lockout | **60 Minutes** | Immediate direct call to driver, parent, and school security. |
| **HIGH** | Student Missing at Gate / Unauthorized Driver | **240 Minutes** | Gate supervisor dispatch + Class teacher verification. |
| **MEDIUM** | Major Traffic Congestion / 20m+ Road Delay | **1440 Minutes** | Broadcast SMS to affected parents + route update. |
| **LOW** | Minor schedule inquiry / document resubmission | **4320 Minutes** | Standard operations queue handling. |

### 3.2. Critical Emergency Protocol (Parent SOS Triggered)
1. **Instant Alert:** Siren and push notification triggers on the Admin Console (`ops.tinyride.in/safety`).
2. **Contact Chain:**
   - **Step 1:** Dispatcher calls Vehicle Driver directly via live phone link on fleet dashboard.
   - **Step 2:** Dispatcher verifies vehicle GPS coordinates on telemetry map.
   - **Step 3:** Dispatcher calls Parent/Guardian to confirm status.
   - **Step 4:** If physical distress or accident confirmed, Dispatcher calls Telangana Emergency Response Center (**Dial 112** or **Traffic Police 100**).

---

## Runbook 4: Driver / Vehicle Safety Impoundment

In the event of reckless driving, failed police verification, or vehicle mechanical breakdown:

1. **Immediate Revocation in Console:**
   - Operator navigates to `/admin/kyc/drivers` or `/admin/kyc/vehicles`.
   - Action: `SUSPEND` or `REJECT` with mandatory reason code `SAFETY_VIOLATION`.
2. **Automatic System Safeguards:**
   - Database trigger `app.enforce_state_machine()` immediately halts active trips.
   - Suspended drivers are barred from claiming today's manifests (`403 Forbidden`).
3. **Route Reassignment:**
   - Standby backup vehicle and pre-approved relief driver are assigned to the route schedule via `POST /api/v1/routes/schedules/assign`.
   - Parents receive automated push notification: *"Vehicle updated for today's run. Verified replacement driver assigned."*

---

## Runbook 5: Weekly Fleet Owner Payout Settlements

### 5.1. Payout Calculation Formula
- Every confirmed booking creates balanced ledger entries:
  - `gateway_clearing`: -₹4,500.00 (Debit)
  - `platform_revenue` (15%): +₹675.00 (Credit)
  - `owner_payable` (85%): +₹3,825.00 (Credit)
- Weekly payout transfers the accumulated `owner_payable` balance to the fleet owner's verified bank account via RazorpayX.

### 5.2. Settlement Runbook
1. Finance Admin accesses `ops.tinyride.in/finance`.
2. Verifies that the global ledger audit shows **₹0.00 Discrepancy**.
3. Approves weekly batch settlement.
4. Database records settlement transaction:
   - `owner_payable`: -₹3,825.00 (Debit)
   - `cash`: +₹3,825.00 (Credit)
5. Fleet owner's mobile app reflects updated ledger balance and payout receipt.
