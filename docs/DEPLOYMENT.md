# TinyRide — Cloud Deployment & Infrastructure Architecture

**Project:** TinyRide by Dodail  
**Company:** Dodail Solutions Private Limited  
**Target Market:** Hyderabad, Telangana, India  
**Domain:** `tinyride.in`  

---

## 1. Production Architecture Overview

TinyRide utilizes a distributed, containerized micro-frontend and modular monolith topology designed for high availability, zero overselling, and strict data tenant isolation.

```
                           [ Cloudflare Edge CDN / DNS (tinyride.in) ]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
[ ops.tinyride.in ]            [ schools.tinyride.in ]           [ api.tinyride.in ]
 Next.js Admin Console          Next.js School Portal             NestJS API Monolith
 (Port 3001 / Cloudflare)       (Port 3002 / Cloudflare)          (Port 3000 / AWS ECS)
        │                                │                                │
        └────────────────────────────────┴────────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
        [ Supavisor Transaction Pooler ]         [ Supabase Private S3 Storage ]
             PostgreSQL 16 (Port 6543)                 (KYC & Vehicle Docs)
                    │
            [ Master PostgreSQL ]
          Schemas: public, app, archive
```

---

## 2. Infrastructure Components

| Component | Technology | Recommended Host | Production URL |
| :--- | :--- | :--- | :--- |
| **API Backend** | NestJS (Node 22 / Alpine) | AWS ECS Fargate / Render | `https://api.tinyride.in` |
| **Admin Console** | Next.js 15 (React 19) | Cloudflare Pages / Vercel | `https://ops.tinyride.in` |
| **School Portal** | Next.js 15 (React 19) | Cloudflare Pages / Vercel | `https://schools.tinyride.in` |
| **Database** | PostgreSQL 16 + PostGIS | Supabase Cloud (AWS ap-south-1 Mumbai) | `db.bfdcxaenmdomjsbvcbpj.supabase.co` |
| **Document Storage**| S3-compatible Object Storage | Supabase Storage (Private Buckets) | `documents-private` |
| **Payment Gateway**| Razorpay Orders & Webhooks | Razorpay India Production | `api.razorpay.com` |

---

## 3. Deployment Step-by-Step

### 3.1. Database Migration & Initialization
All canonical database migrations reside in `sql/` and must be applied sequentially using the Supabase CLI or direct database migration runners:

```bash
# 1. Connect to remote Supabase instance
supabase link --project-ref bfdcxaenmdomjsbvcbpj

# 2. Verify all 11 canonical migration stages are applied
psql "$DATABASE_URL" -f sql/00_roles_and_extensions.sql
psql "$DATABASE_URL" -f sql/01_states_and_transitions.sql
psql "$DATABASE_URL" -f sql/02_core_master_data.sql
psql "$DATABASE_URL" -f sql/03_supply_partners.sql
psql "$DATABASE_URL" -f sql/04_routes_and_pricing.sql
psql "$DATABASE_URL" -f sql/05_parent_child_family.sql
psql "$DATABASE_URL" -f sql/06_bookings_and_ledger.sql
psql "$DATABASE_URL" -f sql/07_trips_and_handovers.sql
psql "$DATABASE_URL" -f sql/08_safety_and_incidents.sql
psql "$DATABASE_URL" -f sql/09_operations_support.sql
psql "$DATABASE_URL" -f sql/10_triggers_and_indexes.sql
```

### 3.2. Containerized Backend Deployment (AWS ECS Fargate)

1. **Build and Tag Multi-Stage Docker Image:**
   ```bash
   docker build -t tinyride-api:latest -f Dockerfile .
   docker tag tinyride-api:latest 123456789012.dkr.ecr.ap-south-1.amazonaws.com/tinyride-api:v1.0.0
   ```

2. **Push to AWS Elastic Container Registry (ECR Mumbai):**
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-south-1.amazonaws.com
   docker push 123456789012.dkr.ecr.ap-south-1.amazonaws.com/tinyride-api:v1.0.0
   ```

3. **Deploy ECS Task Definition:**
   - Compute: Fargate (0.5 vCPU, 1024 MB RAM).
   - Port Mapping: `3000 -> 3000`.
   - Health Check Path: `/health/liveness` (HTTP, interval: 30s, timeout: 5s, retries: 3).
   - Secrets: Inject from AWS Secrets Manager (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET`).

### 3.3. Web Application Deployment (Next.js)

1. **Admin Operations Web Console (`apps/admin-web`):**
   - Build command: `pnpm --filter @tinyride/admin-web build`
   - Output directory: `.next`
   - Node version: `22.x`
   - Environment variables: `NEXT_PUBLIC_API_URL=https://api.tinyride.in/api/v1`

2. **School Gate Web Portal (`apps/school-web`):**
   - Build command: `pnpm --filter @tinyride/school-web build`
   - Output directory: `.next`
   - Environment variables: `NEXT_PUBLIC_API_URL=https://api.tinyride.in/api/v1`

---

## 4. Domain & DNS Configuration

| Hostname | Type | Target / Value | Proxy Status |
| :--- | :--- | :--- | :--- |
| `api.tinyride.in` | CNAME | `alb-tinyride-prod-12345.ap-south-1.elb.amazonaws.com` | DNS Only (HSTS) |
| `ops.tinyride.in` | CNAME | `admin-web.pages.dev` | Proxied (Cloudflare) |
| `schools.tinyride.in` | CNAME | `school-web.pages.dev` | Proxied (Cloudflare) |

---

## 5. Rollback & Disaster Recovery Procedures

1. **Zero-Downtime Rolling Deployment:**
   - AWS Application Load Balancer routes traffic to new ECS tasks only after passing the `/health/readiness` probe.
   - If new tasks fail health checks within 60 seconds, ECS aborts deployment and preserves active instances.

2. **Emergency Container Rollback:**
   ```bash
   aws ecs update-service \
     --cluster tinyride-prod-cluster \
     --service tinyride-api-service \
     --task-definition tinyride-api:PREVIOUS_REVISION \
     --force-new-deployment
   ```
