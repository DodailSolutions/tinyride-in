# TinyRide v3 schema

Improved Supabase/PostgreSQL schema for TinyRide, derived from the v2 DDL and the
product requirements document. See the accompanying review document for the
reasoning behind each change.

## Layout

| File | Contents |
| --- | --- |
| `sql/00_extensions_helpers.sql` | Extensions, `app`/`archive` schemas, generic triggers, RLS helper functions |
| `sql/01_enums_lookups.sql` | Enums, the unified `states` table and the state-transition graph |
| `sql/02_identity_family_school.sql` | Profiles, roles, consents, parents, children, guardians, schools, calendars |
| `sql/03_supply.sql` | Drivers, owners, vehicles, assignments, documents, verification reviews |
| `sql/04_routes.sql` | Routes, stops, schedules, schedule stops, prices, driver/vehicle assignment validation |
| `sql/05_booking.sql` | Seat holds, bookings, subscriptions, seat counters, `app.reserve_seat()` |
| `sql/06_payments.sql` | Payments, webhooks, double-entry ledger, payouts, idempotency keys |
| `sql/07_trips.sql` | Trips, absences, manifests, handovers and tokens, events, telemetry, `app.generate_trips_for_date()` |
| `sql/08_safety_ops.sql` | Operational exceptions with SLA, incidents, evidence, reassignment requests |
| `sql/09_comms_support_audit.sql` | Notifications, support tickets and scopes, audit log, exports, retention |
| `sql/10_rls.sql` | Row-level security policies, the driver manifest view, and grants |

Apply the files in numeric order. They are idempotent only as a whole run against
an empty database; treat `00`–`10` as the baseline migration.

## Tests

`./test/run.sh [dbname]` drops and recreates a local database, applies the schema,
then runs:

- `test/99_smoke.sql` — seeds a small Hyderabad pilot and asserts the safety,
  capacity, trip-generation, handover and ledger invariants.
- `test/99b_rls.sql` — re-runs reads as a parent, a driver and an anonymous caller.

`test/00_supabase_stub.sql` provides `auth.users`, `auth.uid()` and the `anon` /
`authenticated` / `service_role` roles so the schema runs off-platform. It is a test
fixture and must not be applied to Supabase.

The driver manifest view uses `security_invoker`, which needs PostgreSQL 15 or newer
(Supabase has it). The runner strips it on older local instances.

## Scheduled jobs the schema expects

- `app.generate_trips_for_date(date)` — daily, idempotent, safe to run repeatedly.
- Seat-hold expiry sweep.
- Monthly partition creation for `trip_locations` and `audit_logs`.
- Retention enforcement driven by `retention_policies`.
