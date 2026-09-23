# TinyRide — Testing Architecture & Verification Manual

**Project:** TinyRide by Dodail  
**Company:** Dodail Solutions Private Limited  
**Quality Standard:** 100% Pass Rate on Invariants & Server-Side Verification  

---

## 1. Testing Philosophy

TinyRide adheres to a strict safety-first engineering standard. We reject synthetic mock success responses in favor of rigorous server-side verification:
1. **Unit Testing:** Validates business logic, DTO transformations, domain guards, and financial accounting formulas in isolation.
2. **End-to-End Integration Testing:** Validates complete REST request lifecycles against real HTTP pipelines, interceptors, validation pipes, and database constraints.
3. **Golden-Path Journey Testing:** Exercises multi-stakeholder interactions (Parent, Driver, Gate Security, Central Operations) in a continuous operational chain.

---

## 2. Test Execution Commands

### 2.1. Backend Unit Tests (Jest)
Runs all 22 unit test suites across authentication, supply KYC, parent management, payments, handovers, safety exceptions, school operations, and financial auditing:

```bash
# Run all unit tests
pnpm --filter @tinyride/api test

# Run tests with code coverage report
pnpm --filter @tinyride/api test:cov

# Run specific service test
pnpm --filter @tinyride/api test src/modules/handovers/handovers.service.spec.ts
```

### 2.2. End-to-End Integration Tests (Supertest + NestJS)
Runs all 8 integration suites against live Express HTTP pipelines:

```bash
# Run all integration suites
pnpm --filter @tinyride/api test:e2e

# Run the complete multi-stakeholder golden journey
pnpm --filter @tinyride/api test:e2e test/e2e-journey.e2e-spec.ts
```

### 2.3. Full Monorepo Typecheck & Build
Compiles all packages, Next.js web applications, and mobile projects:

```bash
# Full workspace compilation
pnpm build
```

---

## 3. Verified Test Suites Catalog

### 3.1. Unit Test Suites (22 Suites, 85 Tests — 100% Pass)
- `src/modules/admin/ops/ops.service.spec.ts` (Overview metrics, fleet live tracking)
- `src/modules/safety/safety.service.spec.ts` (Exceptions, dynamic SLA countdowns, incident reference generation)
- `src/modules/admin/kyc/kyc.service.spec.ts` (Driver, vehicle, and route approval workflows)
- `src/modules/drivers/drivers.service.spec.ts` (Onboarding, document signed URLs)
- `src/modules/trips/trips.service.spec.ts` (Daily trip generation, state machine transitions)
- `src/modules/handovers/handovers.service.spec.ts` (SafeKey OTP hashing, 3-attempt lockout)
- `src/modules/payments/payments.service.spec.ts` (Double-entry ledger balance, Razorpay webhooks)
- `src/modules/admin/finance/finance.service.spec.ts` (Zero-drift reconciliation)
- `src/modules/parents/parents.service.spec.ts` (Multi-child profiles, authorized guardians)
- `src/modules/vehicles/vehicles.service.spec.ts` (Seating vs usable capacity checks)
- `src/modules/schools/schools.service.spec.ts` (Tenant isolation, gate arrival & release)
- `src/modules/auth/auth.service.spec.ts` (Phone OTP auth, RBAC resolution)
- `src/common/guards/supabase-auth.guard.spec.ts` (JWT extraction & signature verification)
- `src/common/guards/roles.guard.spec.ts` (Multi-role authorization)
- `src/common/guards/parent-ownership.guard.spec.ts` (Cross-tenant parent data protection)
- `src/modules/audit/audit.service.spec.ts` (Immutable audit logging)
- `src/modules/admin/support/support.service.spec.ts` (Support ticket state machine)
- `src/modules/routes/routes.service.spec.ts` (Route proposals, stop sequencing)
- `src/modules/bookings/bookings.service.spec.ts` (Pessimistic seat holds, capacity checks)
- `src/common/filters/http-exception.filter.spec.ts` (Standardized JSON error envelope)
- `src/common/config/env.config.spec.ts` (Environment variable validation schema)
- `src/modules/health/health.controller.spec.ts` (Terminus liveness & readiness)

### 3.2. End-to-End Integration Suites (8 Suites, 44 Tests — 100% Pass)
1. `test/app.e2e-spec.ts`: System health probes and CORS verification.
2. `test/auth.e2e-spec.ts`: Phone OTP request, verification, profile retrieval, and RBAC rejection.
3. `test/supply.e2e-spec.ts`: Driver onboarding, vehicle registration, and KYC approval queue.
4. `test/booking-payment.e2e-spec.ts`: Seat holds, booking creation, and Razorpay HMAC signature validation.
5. `test/trips-safety.e2e-spec.ts`: Trip state progression, OTP verification, and safety exceptions.
6. `test/admin.e2e-spec.ts`: Operational overview, financial reconciliation RBAC, and support queues.
7. `test/schools.e2e-spec.ts`: School-scoped tenant boundary and gate arrival/release check-ins.
8. `test/e2e-journey.e2e-spec.ts`: 8-step complete golden-path operational lifecycle.

---

## 4. Continuous Integration Pipeline (GitHub Actions)

Recommended `.github/workflows/ci.yml` pipeline:

```yaml
name: TinyRide CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10.23.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Type Check & Workspace Build
        run: pnpm build

      - name: Run Backend Unit Tests
        run: pnpm --filter @tinyride/api test

      - name: Run E2E Integration Tests
        run: pnpm --filter @tinyride/api test:e2e
```
