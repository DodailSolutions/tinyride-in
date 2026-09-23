# TinyRide — OpenAPI Specification & REST Endpoint Reference

**Base URL:** `https://api.tinyride.in/api/v1`  
**Swagger UI:** `http://localhost:3000/api/docs`  
**Standard Envelope:** All errors return `{ success: false, error: { code, message, correlationId }, timestamp }`  

---

## 1. Global Headers

| Header | Required | Example | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | Yes (Protected) | `Bearer eyJhbGci...` | Supabase JWT token. |
| `Content-Type` | Yes (POST/PATCH)| `application/json` | Request payload format. |
| `X-Correlation-Id` | Optional | `4ff534c7-b82e-45de` | Distributed tracing correlation ID. |

---

## 2. Authentication & Identity (`/auth`)

### `POST /auth/otp/send`
- **Role:** Public
- **Body:** `{ "phoneE164": "+919876543210" }`
- **Response:** `200 OK` `{ "success": true, "message": "OTP dispatched via SMS" }`

### `POST /auth/otp/verify`
- **Role:** Public
- **Body:** `{ "phoneE164": "+919876543210", "token": "482910" }`
- **Response:** `200 OK` `{ "accessToken": "jwt-token", "user": { "userId", "phoneE164", "roles": ["parent"] } }`

### `GET /auth/me`
- **Role:** Authenticated
- **Response:** `200 OK` `{ "userId": "...", "phoneE164": "+919876543210", "roles": [...] }`

---

## 3. Supply: Drivers & Vehicles (`/drivers`, `/vehicles`)

### `POST /drivers/register`
- **Role:** `driver`
- **Body:** `{ "licenseNumber": "TS09-2016-0033445", "licenseExpiry": "2030-12-31", "city": "Hyderabad" }`
- **Response:** `201 Created`

### `POST /drivers/documents/upload-url`
- **Role:** `driver`
- **Body:** `{ "documentType": "commercial_license", "fileName": "license.pdf" }`
- **Response:** `200 OK` `{ "signedUrl": "https://...", "storagePath": "..." }`

### `POST /vehicles`
- **Role:** `vehicle_owner`
- **Body:** `{ "registrationPlate": "TS09UB9876", "vehicleType": "van", "seatingCapacity": 12, "usableCapacity": 10 }`
- **Response:** `201 Created` *(Anti-overcrowding invariant enforced)*

### `POST /vehicles/assign-driver`
- **Role:** `vehicle_owner`
- **Body:** `{ "vehicleId": "uuid", "driverId": "uuid" }`
- **Response:** `200 OK`

---

## 4. Routes & Seat Allocation (`/routes`, `/bookings`)

### `GET /routes`
- **Role:** Public
- **Query:** `?schoolId=uuid`
- **Response:** `200 OK` Array of active, verified routes and schedules.

### `POST /bookings/reserve`
- **Role:** `parent`
- **Body:** `{ "scheduleId": "uuid", "childId": "uuid", "holdMinutes": 10 }`
- **Response:** `201 Created` `{ "holdId": "...", "expiresAt": "..." }` *(Pessimistic concurrency lock)*

### `POST /bookings`
- **Role:** `parent`
- **Body:** `{ "childId": "uuid", "scheduleId": "uuid", "pickupStopId": "uuid", "dropoffStopId": "uuid", "serviceStart": "2026-06-01", "billingPeriod": "monthly" }`
- **Response:** `201 Created` Booking in `awaiting_payment` state.

---

## 5. Payments & Webhooks (`/payments`)

### `POST /payments/order`
- **Role:** `parent`
- **Body:** `{ "bookingId": "uuid" }`
- **Response:** `201 Created` `{ "orderId": "order_hyd_...", "amountMinor": 450000, "currency": "INR" }`

### `POST /payments/webhook/razorpay`
- **Role:** Public (HMAC Verified)
- **Header:** `X-Razorpay-Signature: <hmac_sha256>`
- **Body:** Razorpay event payload (`order.paid`, `payment.captured`).
- **Response:** `201 Created` *(Balances double-entry ledger: 15% platform, 85% owner payable)*

---

## 6. Daily Trips & Handover SafeKey (`/trips`, `/handovers`)

### `POST /trips/generate`
- **Role:** `operator`, `admin`
- **Body:** `{ "date": "2026-06-01" }`
- **Response:** `201 Created` `{ "tripsCreated": 6, "manifestEntriesCreated": 42 }`

### `GET /trips/manifest/today`
- **Role:** `driver`
- **Response:** `200 OK` Active trip stops, ordered child roster, and medical care tags.

### `PATCH /trips/:id/state`
- **Role:** `driver`, `operator`
- **Body:** `{ "state": "ready" | "in_progress" | "completed" | "cancelled" }`
- **Response:** `200 OK` *(Completion invariant: blocked if uncompleted handovers remain)*

### `POST /handovers/otp/request`
- **Role:** `driver`
- **Body:** `{ "tripChildId": "uuid", "leg": "home_pickup" | "home_dropoff" }`
- **Response:** `201 Created` `{ "tokenId": "...", "expiresAt": "..." }`

### `POST /handovers/verify`
- **Role:** `driver`
- **Body:** `{ "tripChildId": "uuid", "leg": "home_pickup" | "home_dropoff", "method": "otp", "otp": "482910" }`
- **Response:** `201 Created` `{ "success": true, "state": "picked_up" | "dropped_off" }`

---

## 7. School Gate Operations (`/schools`)

### `GET /schools/my-school`
- **Role:** `school_staff`, `admin`
- **Response:** `200 OK` Affiliated school profile, timetable, and gate operating parameters.

### `GET /schools/roster`
- **Role:** `school_staff`, `admin`
- **Response:** `200 OK` Isolated student transport roster with allergy tags and emergency phone numbers.

### `POST /schools/arrivals/confirm`
- **Role:** `school_staff`, `admin`
- **Body:** `{ "tripChildId": "uuid", "notes": "optional" }`
- **Response:** `200 OK` *(Records arrival receipt attributed to staff member UUID)*

### `POST /schools/releases/confirm`
- **Role:** `school_staff`, `admin`
- **Body:** `{ "tripChildId": "uuid", "driverVerified": true, "vehicleVerified": true }`
- **Response:** `200 OK` *(Authorizes gate departure to verified driver)*

---

## 8. Admin Operations, Finance & Support (`/admin/*`)

### `GET /admin/ops/overview`
- **Role:** `operator`, `admin`
- **Response:** `200 OK` Real-time fleet metrics (active vans, handovers completed, alerts).

### `GET /admin/finance/reconciliation`
- **Role:** `finance_admin`, `admin`
- **Response:** `200 OK` Append-only double-entry ledger balance assertion (0 discrepancy).

### `GET /admin/support/tickets`
- **Role:** `support_agent`, `admin`
- **Response:** `200 OK` Open parent/driver inquiries with SLA priority levels.
