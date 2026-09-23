# TinyRide — Open Decisions & Unresolved Requirements Log
**Company:** Dodail Solutions Private Limited  
**Platform:** TinyRide  
**Market:** Hyderabad, Telangana, India  
**Status:** Awaiting Executive & Legal Review  

---

> [!IMPORTANT]
> In accordance with architectural principles, business policies, regulatory interpretations, safety procedures, and fee schedules are **never invented**. This log records all pending decisions with proposed defaults, trade-offs, and required stakeholders.

---

## 1. Regulatory & Compliance Decisions (Telangana / Hyderabad RTA)

| Decision ID | Area | Description | Proposed Default | Impact / Regulatory Context | Approval Needed |
|---|---|---|---|---|---|
| **DEC-REG-01** | Vehicle Capacity | Maximum legal passenger capacity for school autos and vans in Hyderabad. | Autos: 4-5 children; Vans: 8-12 children (per vehicle RC `usable_capacity`). | Telangana Motor Vehicle Rules specify seating limits for school transit. Strict compliance required to avoid seizure. | Legal / RTA Advisor |
| **DEC-REG-02** | Attendant Mandate | Requirement of an adult female attendant / conductor on school vehicles. | Mandatory on 10+ seater vans; optional on 4-seater autos. | Child safety regulations in Telangana mandate attendants on school buses/vans. | Legal / Safety Committee |
| **DEC-REG-03** | Driver Background Checks | Procedure for driver criminal background verification. | Mandatory Telangana Police verification certificate prior to approval. | KYC reviewers cannot approve drivers without verified police clearance upload. | Operations & Legal |
| **DEC-REG-04** | Document Validity Checks | Grace period policy for expiring vehicle fitness/permit/insurance documents. | Zero grace period for insurance and fitness; auto-suspension on expiry date. | Operating a vehicle with lapsed insurance creates unlimited liability. | Legal Counsel |

---

## 2. Business Model & Financial Policy Decisions

| Decision ID | Area | Description | Proposed Default | Trade-off / Notes | Approval Needed |
|---|---|---|---|---|---|
| **DEC-FIN-01** | Platform Commission | Fee percentage retained by TinyRide from gross booking receipts. | 15% platform commission + GST; 85% payable to Vehicle Owner. | Configurable in `platform_fee` ledger account. Needs validation against driver retention. | Founder / Finance Lead |
| **DEC-FIN-02** | Driver/Owner Payout Cycle | Frequency and settlement timeline for driver/owner earnings. | Weekly on Tuesdays (for the preceding Monday–Sunday cycle). | Daily payouts increase banking API costs; monthly delays supply partner cashflow. | Finance Admin |
| **DEC-FIN-03** | Cancellation & Refund Policy | Refund calculation when a parent cancels an active monthly subscription. | Pro-rata refund for uncommenced calendar weeks minus 10% administrative fee. | Zero refund after route start vs generous refunds. Needs customer contract alignment. | Product / Legal |
| **DEC-FIN-04** | Absenteeism Credit | Whether parents receive fee credits/discounts when reporting child illness or vacation. | No fee adjustment for parent-reported absences (seat remains reserved). | School transport operates on reserved monthly capacity, not per-ride metering. | Founder / Product Lead |
| **DEC-FIN-05** | Payment Grace Period | Window before a seat reservation is cancelled if recurring payment fails. | 48 hours grace period with daily notification reminders. | Balancing vehicle seat occupancy with parent payment processing delays. | Product / Operations |

---

## 3. Child Safety & Operational Exception Decisions

| Decision ID | Area | Description | Proposed Default | Trade-off / Notes | Approval Needed |
|---|---|---|---|---|---|
| **DEC-SAF-01** | OTP Fallback Protocol | Verification procedure when a parent's phone is unreachable or battery is dead at pickup. | Pre-authorized guardian verification via secondary phone OTP, or School/Operations manual phone override with logged reason code. | GPS alone is strictly disallowed. Driver cannot take child without verified token or logged ops override. | Safety Lead / Operations |
| **DEC-SAF-02** | Unconfirmed School Receipt | Action required if school gate staff fails to confirm child receipt within 15 minutes of driver arrival. | Automatic high-severity operational exception generated with SMS alert to parents and operations desk. | Prevents children from being unaccounted for between auto drop and school gate. | Safety Lead |
| **DEC-SAF-03** | Vehicle Breakdown & Backup | Protocol for driver reassignment during en-route breakdown. | Driver triggers 'Breakdown' in app; Operations assigns certified backup vehicle; parents notified immediately with new driver/vehicle credentials. | Automated backup suggestions vs human-verified dispatch. Human approval mandatory. | Operations Lead |
| **DEC-SAF-04** | Maximum Detour Time | Upper threshold for student commute duration / route deviation. | Maximum 15-20 minutes detour per route; maximum 45-minute total one-way journey. | Long commutes lead to child fatigue and parent dissatisfaction. | Product Lead |

---

## 4. Technical & Third-Party Integration Decisions

| Decision ID | Area | Description | Proposed Default | Considerations | Approval Needed |
|---|---|---|---|---|---|
| **DEC-TECH-01**| SMS / OTP Provider | Primary gateway for sending mobile authentication OTPs and urgent safety alerts in India. | Supabase Auth SMS gateway with Twilio or Fast2SMS / Gupshup DLT-registered templates. | Indian TRAI DLT registration is mandatory for commercial SMS in India. | DevOps / Founder |
| **DEC-TECH-02**| Payment Gateway | Production gateway configuration for INR payments and UPI auto-debit. | Razorpay Orders API + Webhooks with HMAC SHA256 signature verification. | Requires active Dodail Solutions Razorpay Merchant ID and KYC approval. | Finance / Founder |
| **DEC-TECH-03**| Map & Routing APIs | Provider for address geocoding, route distance calculation, and ETAs. | Google Maps Platform (Directions API, Geocoding API). | Requires Google Cloud billing account and quota controls. | Engineering Lead |
| **DEC-TECH-04**| Push Notifications | Push notification service for Android & iOS mobile apps. | Expo Push Notification service with Firebase Cloud Messaging (FCM) fallback. | Reliable delivery required for time-sensitive pickup reminders. | Engineering Lead |
