# TinyRide — Environment Variables & Secrets Reference

**Company:** Dodail Solutions Private Limited  
**Security Standard:** Zero Hardcoded Secrets & Principle of Least Privilege  

---

## 1. Classification & Security Guidelines

| Classification | Definition | Exposure Policy |
| :--- | :--- | :--- |
| **CRITICAL_SECRET** | Master credentials, database service-role keys, private encryption tokens. | Store in AWS Secrets Manager / Doppler. Never log or transmit to clients. |
| **SENSITIVE_KEY** | Third-party API private keys (Razorpay Secret, Twilio Token). | Restricted strictly to NestJS backend environment. |
| **PUBLIC_CONFIG** | Client-facing URLs, project identifiers, public gateway keys. | Embedded into Next.js/Expo builds via `NEXT_PUBLIC_*` or `app.json`. |

---

## 2. Master Catalog of Environment Variables

### 2.1. Backend Monolith (`apps/api`)

| Variable Name | Classification | Default (Local / Staging) | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `PUBLIC_CONFIG` | `development` | Runtime environment (`development`, `staging`, `production`, `test`). |
| `PORT` | `PUBLIC_CONFIG` | `3000` | HTTP listening port for Express / NestJS engine. |
| `SUPABASE_URL` | `PUBLIC_CONFIG` | `https://bfdcxaenmdomjsbvcbpj.supabase.co` | Supabase Cloud API gateway endpoint. |
| `SUPABASE_ANON_KEY` | `PUBLIC_CONFIG` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public client key for PostgREST & Auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | **`CRITICAL_SECRET`** | *(From vault)* | High-privilege key bypassing RLS for server-side state transitions. |
| `JWT_SECRET` | **`CRITICAL_SECRET`** | *(From vault)* | HMAC-SHA256 secret for validating Supabase JWT signatures. |
| `RAZORPAY_KEY_ID` | `PUBLIC_CONFIG` | `rzp_test_placeholder` | Public Merchant ID for Razorpay Checkout. |
| `RAZORPAY_KEY_SECRET` | **`CRITICAL_SECRET`** | `rzp_secret_placeholder` | Private Razorpay API secret for order authorization. |
| `RAZORPAY_WEBHOOK_SECRET` | **`CRITICAL_SECRET`** | `rzp_webhook_secret_placeholder` | Secret for verifying HMAC SHA256 webhook signatures. |
| `CORS_ORIGIN` | `PUBLIC_CONFIG` | `http://localhost:3001,http://localhost:3002` | Whitelisted comma-delimited web portal origins. |
| `OTP_TTL_MINUTES` | `PUBLIC_CONFIG` | `15` | Handover SafeKey validity window in minutes. |
| `MAX_OTP_ATTEMPTS` | `PUBLIC_CONFIG` | `3` | Maximum failed verification attempts before security lockout. |

---

### 2.2. Admin Operations Web Console (`apps/admin-web`)

| Variable Name | Classification | Default (Local) | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `PUBLIC_CONFIG` | `3001` | Local Next.js port. |
| `NEXT_PUBLIC_API_URL` | `PUBLIC_CONFIG` | `http://localhost:3000/api/v1` | Public REST API endpoint consumed by browser client. |

---

### 2.3. School Web Portal (`apps/school-web`)

| Variable Name | Classification | Default (Local) | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `PUBLIC_CONFIG` | `3002` | Local Next.js port for School Gate Console. |
| `NEXT_PUBLIC_API_URL` | `PUBLIC_CONFIG` | `http://localhost:3000/api/v1` | REST API endpoint consumed by school gate terminals. |

---

### 2.4. Mobile Applications (`parent-mobile` & `driver-mobile`)

| Property / Key | Classification | Location | Description |
| :--- | :--- | :--- | :--- |
| `extra.apiUrl` | `PUBLIC_CONFIG` | `app.json` | Base URL of NestJS backend (`http://localhost:3000/api/v1`). |
| `extra.company` | `PUBLIC_CONFIG` | `app.json` | Legal operating entity: `Dodail Solutions Private Limited`. |
| `extra.tagline` | `PUBLIC_CONFIG` | `app.json` | Brand tagline: `Little Rides. Big Peace of Mind.`. |

---

## 3. Secret Rotation Procedures

### 3.1. Razorpay Webhook Secret Rotation
1. Generate new webhook secret in Razorpay Dashboard (`Settings > Webhooks`).
2. Update AWS Secrets Manager entry `/tinyride/prod/RAZORPAY_WEBHOOK_SECRET`.
3. Trigger rolling restart of ECS tasks:
   ```bash
   aws ecs update-service --cluster tinyride-prod-cluster --service tinyride-api-service --force-new-deployment
   ```
4. Verify signature validation passes by sending test webhook ping.

### 3.2. Supabase Service Role Key Rotation
1. Regenerate `service_role` key in Supabase Dashboard (`Project Settings > API`).
2. Immediately inject new secret into AWS Secrets Manager.
3. Deploy new task definitions. Old key will remain valid during a 2-minute transition window.
