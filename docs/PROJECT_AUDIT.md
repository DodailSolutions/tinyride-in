# TinyRide by Dodail — Project Audit & Repository Assessment
**Company:** Dodail Solutions Private Limited  
**Platform:** TinyRide (School Transportation Platform)  
**Initial Pilot:** Hyderabad, Telangana, India  
**Date:** September 2026  
**Auditor:** Lead Software Architect & Technical Lead  

---

## 1. Executive Summary

An exhaustive audit of the existing TinyRide repository was conducted. The current repository contains the **v3 PostgreSQL / Supabase database DDL schema** and local SQL smoke tests, representing the foundational relational data model for TinyRide. However, there is currently **no application code, no NestJS backend service, no frontend client applications, and no shared packages**.

The v3 database schema is of exceptional architectural rigor: it enforces an explicit state-machine graph (`states`, `state_domains`, `state_transitions`), pessimistic seat reservation locks (`app.reserve_seat`), transactional capacity accounting (`schedule_seat_counters`), an append-only double-entry ledger (`ledger_entries`), and default-deny Row Level Security (`10_rls.sql`) across all public tables.

The immediate imperative is to preserve this database architecture, establish the TypeScript monorepo workspace (pnpm workspaces), scaffold the NestJS modular monolith backend (`apps/api`), build shared type/validation contracts (`packages/shared-types`, `packages/shared-validation`, `packages/design-system`), and systematically implement Phase 1 through Phase 9 as defined in the master specification.

---

## 2. Repository Inventory

```
tinyride-v3-schema/
├── .env.example              # Template with Supabase config placeholders
├── .env                      # Contains Supabase URL, anon key, service-role key (DB URL empty)
├── .gitignore                # Ignores .env, .env.local, .DS_Store
├── README.md                 # Documentation on v3 schema layout, test runners, scheduled jobs
├── apply_supabase_schema.sh  # Bash script using psql to apply sql/00 to sql/10
├── sql/                      # 11 Modular SQL migration scripts
│   ├── 00_extensions_helpers.sql   # PostGIS, pgcrypto, citext, helper functions
│   ├── 01_enums_lookups.sql        # Enums, states lookup, state transitions graph
│   ├── 02_identity_family_school.sql # Cities, zones, profiles, roles, parents, children, schools
│   ├── 03_supply.sql               # Drivers, vehicle owners, vehicles, documents, verification
│   ├── 04_routes.sql               # Routes, stops, schedules, schedule stops, pricing
│   ├── 05_booking.sql              # Seat holds, bookings, subscriptions, seat counters
│   ├── 06_payments.sql             # Payments, webhooks, double-entry ledger, payouts
│   ├── 07_trips.sql                # Trips, absences, manifests, OTP handovers, telemetry
│   ├── 08_safety_ops.sql           # Severities, exceptions, incidents, reassignments
│   ├── 09_comms_support_audit.sql  # Notifications, support tickets, audit logs, retention
│   └── 10_rls.sql                  # Row Level Security policies & security_invoker views
├── supabase_schema.sql       # Single entrypoint script running 00 through 10
└── test/                     # Local test harness
    ├── 00_supabase_stub.sql  # Auth schema & role stub for off-platform testing
    ├── 99_smoke.sql          # End-to-end Hyderabad pilot smoke test
    ├── 99b_rls.sql           # Role-based read/write RLS validation
    └── run.sh                # Shell script to drop/recreate local test DB
```

---

## 3. Technology Stack & Toolchain Audit

| Component | Target / Current | Status | Evaluation |
|---|---|---|---|
| **Node.js Runtime** | Node v24.11.1 | Installed | Modern LTS-ready Node environment. |
| **Package Manager** | pnpm 10.x / npm 11.8.0 | Installed | `pnpm` is available globally; ideal for monorepo workspace. |
| **Backend Framework** | NestJS + TypeScript | Missing | Must be initialized under `apps/api`. |
| **Database** | Supabase PostgreSQL 15+ | Configured | Schemas `00`-`10` ready. `SUPABASE_DB_URL` needs password in `.env`. |
| **Authentication** | Supabase Auth (JWT + OTP) | Configured | Keys present in `.env`. JWT guard & Passport strategy needed in NestJS. |
| **Payment Gateway** | Razorpay (INR) | Specification | Webhook and ledger schema ready; credentials pending configuration. |
| **Mobile Apps** | React Native + Expo | Missing | To be created under `apps/parent-mobile` and `apps/driver-mobile`. |
| **Web Apps** | Next.js + TypeScript | Missing | To be created under `apps/admin-web` and `apps/school-web`. |
| **Shared Packages** | TypeScript packages | Missing | `shared-types`, `shared-validation`, `design-system`, `api-client`. |

---

## 4. Brand Guidelines & Design Tokens Audit

The user provided official brand artifacts and design tokens:
- **Logo & Mascot**: Verified brand mark with tagline: *"Little Rides. Big Peace of Mind."* Features an auto-rickshaw with driver and waving children.
- **Color System Tokens**:
  - `TinyRide Green`: `#0A9C49` (Primary Brand, Success)
  - `TinyRide Navy`: `#012646` (Primary Text, Headings)
  - `Deep Blue`: `#022D53` (Secondary Brand)
  - `Sun Gold`: `#FEA707` (Accent, Attention, Ratings)
  - `Background`: `#FFFFFF`
  - `Surface`: `#F4F7F9`
  - `Border`: `#D7E1E8`
  - `Text Primary`: `#012646`
  - `Text Secondary`: `#526B7F`
  - `Primary Action`: `#067A3A`
  - `Primary Hover`: `#055F2E`
  - `Accent Surface`: `#FFF4D6`
- **Color Ramps**: Defined 9-step scales for Green, Navy, and Gold.
- **Rule of Use**: Navy for body text, Green for primary CTAs/actions, Gold as supporting accent with Navy text.

---

## 5. Feature Completeness Matrix

| Feature Area | Database Schema | Backend API (NestJS) | Frontend UI | Automated Tests | Overall Status |
|---|---|---|---|---|---|
| **Identity & Auth** | Complete (`02_identity_family_school.sql`) | Missing | Missing | SQL RLS stub | **Pending Phase 1 & 2** |
| **Role-Based Access** | Complete (9 distinct roles in `roles`) | Missing | Missing | SQL RLS stub | **Pending Phase 2** |
| **Parent & Family** | Complete (`parents`, `children`, `guardians`) | Missing | Missing | SQL Smoke | **Pending Phase 4** |
| **Supply (Driver & Owner)** | Complete (`drivers`, `owners`, `vehicles`, `documents`) | Missing | Missing | SQL Smoke | **Pending Phase 3** |
| **Route & Schedule** | Complete (`routes`, `route_schedules`, `stops`, `prices`) | Missing | Missing | SQL Smoke | **Pending Phase 3 & 4** |
| **Seat Holds & Bookings** | Complete (`seat_holds`, `reserve_seat()`, `bookings`) | Missing | Missing | SQL Smoke | **Pending Phase 4** |
| **Payments & Ledger** | Complete (`payments`, `payment_webhooks`, `ledger_entries`) | Missing | Missing | SQL Smoke | **Pending Phase 4** |
| **Daily Trips & Handovers** | Complete (`trips`, `trip_children`, `handover_tokens`) | Missing | Missing | SQL Smoke | **Pending Phase 5** |
| **Safety, SLA & Exceptions** | Complete (`exceptions`, `severities`, `incidents`) | Missing | Missing | None | **Pending Phase 5 & 6** |
| **Admin Operations** | Complete (`data_export_requests`, `verification_reviews`) | Missing | Missing | None | **Pending Phase 6** |
| **School Portal** | Complete (`schools`, `school_users`, `school_students`) | Missing | Missing | None | **Pending Phase 7** |
| **Comms & Audit Spine** | Complete (`notifications`, `audit_logs` partitioned) | Missing | Missing | SQL Trigger | **Pending Phase 1 & 2** |

---

## 6. Critical Invariants & Constraints Enforced by Schema

1. **Anti-Oversell Guarantee**: `schedule_seat_counters` and `app.reserve_seat()` lock the counter row `FOR UPDATE`. An exclusion/check constraint prevents `seats_taken > seats_offered`.
2. **State Machine Integrity**: State transitions for all 14 lifecycle domains are stored in `public.state_transitions` and enforced by `app.enforce_state_machine()` trigger on update.
3. **Double-Entry Financial Balance**: Ledger entries enforce paired credit/debit balances in minor currency units (paise). Direct update or deletion of ledger rows is blocked by `app.forbid_mutation()`.
4. **Child Handover Verification**: Single-use, hashed, short-lived tokens bound to `(child_id, trip_id, leg)` preventing unauthorized driver child release.
5. **Data Minimization & Isolation**: RLS restricts parents to their own children, drivers to assigned daily trips only, school staff to verified students in their school, and vehicle owners away from child identity/telemetry.
6. **Append-Only Auditing**: `audit_logs` is range-partitioned monthly and protected by `forbid_mutation()`.

---

## 7. Immediate Risks & Action Items

1. **Database Password Requirement**: `.env` contains project reference `bfdcxaenmdomjsbvcbpj`, but `SUPABASE_DB_URL` requires the actual database password to run live database migrations against Supabase.
2. **Monorepo Scaffolding**: Must build the workspace directory layout (`apps/`, `packages/`, `docs/`) without disturbing existing SQL assets.
3. **Phase 1 NestJS Foundation**: Scaffold the NestJS backend with ConfigModule, SupabaseModule, Swagger OpenAPI, Pino logger, and Health/Metrics endpoints.
