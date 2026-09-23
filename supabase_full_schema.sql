-- =============================================================================
--  TinyRide v3 schema — 00 · Extensions, schemas, helper functions
--  Target: Supabase (PostgreSQL 15+), pilot in Hyderabad (Asia/Kolkata, INR)
-- =============================================================================

-- Supabase convention: keep extensions out of `public` so PostgREST does not
-- expose their functions and so `public` stays app-owned.
create schema if not exists extensions;
create schema if not exists app;      -- helper functions, never exposed to PostgREST
create schema if not exists archive;  -- retention / cold storage

create extension if not exists pgcrypto      with schema extensions;  -- gen_random_uuid, digest
create extension if not exists citext        with schema extensions;  -- case-insensitive email
create extension if not exists pg_trgm       with schema extensions;  -- fuzzy school search
create extension if not exists btree_gist    with schema extensions;  -- exclusion constraints
create extension if not exists postgis       with schema extensions;  -- zone / proximity matching

-- uuid-ossp is intentionally NOT installed: gen_random_uuid() (pgcrypto / core)
-- covers every id in this schema.

set search_path = public, extensions;

-- Helpers are declared before the tables they read so that later files can
-- attach them as triggers/policies; bodies are resolved at call time.
set check_function_bodies = off;

-- -----------------------------------------------------------------------------
-- Generic triggers
-- -----------------------------------------------------------------------------
create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end; $$;

-- Append-only guard for ledger / audit / event tables (PRD: append-only
-- corrections, immutable audit spine). Applied as a BEFORE UPDATE OR DELETE
-- trigger; also revoke update/delete grants for defence in depth.
create or replace function app.forbid_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Table %.% is append-only (attempted %)',
    tg_table_schema, tg_table_name, tg_op
    using errcode = 'restrict_violation';
end; $$;

-- -----------------------------------------------------------------------------
-- Identity helpers (SECURITY DEFINER so RLS policies never recurse)
-- -----------------------------------------------------------------------------
create or replace function app.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$ select auth.uid() $$;

create or replace function app.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.code = p_role
      and ur.revoked_at is null
      and ur.active
  );
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$ select app.has_role('admin') $$;

create or replace function app.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$ select app.has_role('admin') or app.has_role('operator') or app.has_role('support_agent') $$;

create or replace function app.current_parent_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$ select p.id from public.parents p where p.user_id = auth.uid() $$;

create or replace function app.current_driver_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$ select d.id from public.drivers d where d.user_id = auth.uid() $$;

create or replace function app.current_owner_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$ select o.id from public.vehicle_owners o where o.user_id = auth.uid() $$;

create or replace function app.owns_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    join public.parents p on p.id = c.parent_id
    where c.id = p_child_id and p.user_id = auth.uid()
  );
$$;

create or replace function app.is_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.school_users su
    where su.school_id = p_school_id
      and su.user_id = auth.uid()
      and su.revoked_at is null
  );
$$;

-- A driver may only read rows for trips they are actually assigned to, and only
-- for the current operating day (PRD: "current-day assigned schedule" only).
create or replace function app.drives_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trips t
    join public.drivers d on d.id = t.driver_id
    where t.id = p_trip_id
      and d.user_id = auth.uid()
      and t.trip_date between (current_date - 1) and (current_date + 1)
  );
$$;

-- Support access is ticket-scoped: an agent sees a family only while an open
-- ticket grants it.
create or replace function app.has_ticket_grant(p_subject_type text, p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.support_tickets t
    join public.ticket_scopes s on s.ticket_id = t.id
    where t.assigned_to = auth.uid()
      and t.closed_at is null
      and s.subject_type = p_subject_type
      and s.subject_id = p_subject_id
  );
$$;
-- =============================================================================
--  TinyRide v3 schema — 01 · Type strategy: enums vs lookup tables
--
--  RULE (applied consistently, unlike v2):
--   * ENUM        -> closed, engineering-owned classification that ops will
--                    never reorder, recolour or retire (kinds, methods, channels).
--   * LOOKUP TABLE-> anything that is a *lifecycle state*. Ops/product need
--                    labels, colours, ordering, terminal flags and SLA metadata,
--                    and states must be addable without a type rewrite. Every
--                    lifecycle state also gets an explicit transition table so
--                    the state machine is enforced in the database, not only in
--                    application code (PRD: "server-controlled state machine").
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums (classifications)
-- -----------------------------------------------------------------------------
set search_path = public, extensions;

create type consent_type as enum (
  'terms_of_service','privacy_policy','marketing','photo_release','medical_info','location_sharing'
);
create type guardian_relationship as enum (
  'mother','father','grandparent','aunt','uncle','sibling','nanny','family_friend','other'
);
create type school_staff_role as enum ('admin','principal','teacher','office','viewer');
create type document_subject as enum ('driver','vehicle','owner','school');
create type document_type as enum (
  'license','insurance','registration','background_check','police_verification',
  'medical_certificate','vehicle_inspection','fitness_certificate','permit',
  'owner_authorization','school_authorization','other'
);
create type review_subject as enum ('driver','vehicle','owner','route','school','document');
create type verification_decision as enum ('approved','rejected','needs_info');
create type stop_type as enum ('pickup','dropoff','school','waypoint');
create type trip_direction as enum ('am','pm');           -- AM = home->school, PM = school->home
create type assignment_type as enum ('primary','backup','temporary');
create type billing_period as enum ('one_time','weekly','monthly','term');
create type ledger_entry_type as enum (
  'charge','refund','adjustment','platform_fee','gateway_fee','payout','credit','chargeback'
);
create type ledger_account_type as enum (
  'parent_receivable','platform_revenue','gateway_clearing','owner_payable','cash'
);
create type handover_leg as enum ('home_pickup','school_receipt','school_release','home_dropoff');
create type handover_method as enum ('otp','qr_code','photo','signature','guardian_confirm','ops_override');
create type trip_event_type as enum (
  'trip_started','trip_ended','delay','breakdown','traffic','route_deviation',
  'gps_unavailable','offline_sync','readiness_check','note'
);
create type trip_child_event_type as enum (
  'marked_absent','pickup_confirmed','pickup_failed','school_received','school_released',
  'dropoff_confirmed','dropoff_failed','no_show','note'
);
create type incident_event_type as enum (
  'reported','action_taken','evidence_added','status_changed','assigned','resolved','note'
);
create type exception_type as enum (
  'handover_failed','handover_missing','child_no_show','driver_absent','vehicle_breakdown',
  'unapproved_substitution','school_mismatch','capacity_conflict','payment_mismatch',
  'document_expired','offline_conflict','other'
);
create type reassignment_request_type as enum ('backup','substitution');
create type notification_type as enum (
  'booking_confirmed','booking_cancelled','trip_started','trip_ended','child_picked_up',
  'child_dropped_off','child_absent','payment','refund','incident','exception','system'
);
create type notification_channel as enum ('push','sms','email','in_app');
create type ticket_category as enum ('billing','booking','trip','safety','account','other');
create type audit_action as enum (
  'insert','update','delete','login','admin_override','role_change','data_export',
  'privileged_read','suspend','reinstate'
);

-- -----------------------------------------------------------------------------
-- Lookup tables (lifecycle states)
-- -----------------------------------------------------------------------------
create table public.state_domains (
  code        text primary key,
  description text not null
);
insert into public.state_domains (code, description) values
  ('profile','User account lifecycle'),
  ('driver','Driver eligibility lifecycle'),
  ('vehicle','Vehicle eligibility lifecycle'),
  ('route','Route publication lifecycle'),
  ('booking','Parent booking lifecycle'),
  ('subscription','Recurring billing lifecycle'),
  ('payment','Payment lifecycle'),
  ('payout','Owner payout lifecycle'),
  ('trip','Trip lifecycle'),
  ('trip_child','Per-child trip lifecycle'),
  ('incident','Incident lifecycle'),
  ('exception','Operational exception lifecycle'),
  ('ticket','Support ticket lifecycle'),
  ('reassignment','Backup/substitution request lifecycle');

-- One physical table for every lifecycle state keeps FK targets, UI metadata and
-- transition rules uniform; `domain` partitions the namespace.
create table public.states (
  domain      text not null references public.state_domains(code),
  code        text not null,
  label       text not null,
  sort_order  int  not null default 0,
  is_initial  boolean not null default false,
  is_terminal boolean not null default false,
  is_failure  boolean not null default false,
  color       text,
  icon        text,
  description text,
  primary key (domain, code)
);
-- Exactly one initial state per domain.
create unique index states_one_initial on public.states(domain) where is_initial;

create table public.state_transitions (
  domain     text not null references public.state_domains(code),
  from_code  text not null,
  to_code    text not null,
  -- role codes allowed to perform the transition; null = server/service only
  allowed_roles text[],
  primary key (domain, from_code, to_code),
  foreign key (domain, from_code) references public.states(domain, code),
  foreign key (domain, to_code)   references public.states(domain, code)
);

insert into public.states (domain, code, label, sort_order, is_initial, is_terminal, is_failure, color, icon) values
  -- profile
  ('profile','active','Active',10,true,false,false,'#0A9C49',null),
  ('profile','suspended','Suspended',20,false,false,true,'#FEA707',null),
  ('profile','deleted','Deleted',30,false,true,false,'#5c647a',null),
  -- driver (PRD: registration starts Pending Verification)
  ('driver','pending_verification','Pending Verification',10,true,false,false,'#FEA707','⏳'),
  ('driver','needs_resubmission','Needs Resubmission',20,false,false,true,'#ff8c42','✏️'),
  ('driver','approved','Approved',30,false,false,false,'#0A9C49','✅'),
  ('driver','suspended','Suspended',40,false,false,true,'#f2555a','⛔'),
  ('driver','rejected','Rejected',50,false,true,true,'#f2555a','❌'),
  ('driver','inactive','Inactive',60,false,true,false,'#8b93a8','💤'),
  -- vehicle
  ('vehicle','pending_verification','Pending Verification',10,true,false,false,'#FEA707','⏳'),
  ('vehicle','needs_resubmission','Needs Resubmission',20,false,false,true,'#ff8c42','✏️'),
  ('vehicle','approved','Approved',30,false,false,false,'#0A9C49','✅'),
  ('vehicle','maintenance','Maintenance',40,false,false,false,'#4f9cf9','🔧'),
  ('vehicle','suspended','Suspended',50,false,false,true,'#f2555a','⛔'),
  ('vehicle','retired','Retired',60,false,true,false,'#5c647a','🪦'),
  -- route
  ('route','draft','Draft',10,true,false,false,'#8b93a8','📝'),
  ('route','pending_review','Pending Review',20,false,false,false,'#FEA707','⏳'),
  ('route','needs_changes','Needs Changes',30,false,false,true,'#ff8c42','✏️'),
  ('route','approved','Approved',40,false,false,false,'#0A9C49','✅'),
  ('route','paused','Paused',50,false,false,false,'#4f9cf9','⏸'),
  ('route','archived','Archived',60,false,true,false,'#5c647a','🗄'),
  -- booking (PRD: Draft -> Pending Reservation -> Awaiting Payment/Review ->
  -- Confirmed -> Active -> Completed / Cancelled / Expired / Suspended)
  ('booking','draft','Draft',10,true,false,false,'#8b93a8','📝'),
  ('booking','pending_reservation','Pending Reservation',20,false,false,false,'#FEA707','🪑'),
  ('booking','awaiting_payment','Awaiting Payment',30,false,false,false,'#FEA707','💳'),
  ('booking','awaiting_review','Awaiting Review',40,false,false,false,'#FEA707','🔍'),
  ('booking','confirmed','Confirmed',50,false,false,false,'#0A9C49','✅'),
  ('booking','active','Active',60,false,false,false,'#4f9cf9','🚀'),
  ('booking','suspended','Suspended',70,false,false,true,'#ff8c42','⛔'),
  ('booking','completed','Completed',80,false,true,false,'#8b93a8','🏁'),
  ('booking','cancelled','Cancelled',90,false,true,false,'#f2555a','❌'),
  ('booking','expired','Expired',100,false,true,true,'#5c647a','⌛'),
  -- subscription
  ('subscription','active','Active',10,true,false,false,'#0A9C49',null),
  ('subscription','past_due','Past Due',20,false,false,true,'#ff8c42',null),
  ('subscription','paused','Paused',30,false,false,false,'#4f9cf9',null),
  ('subscription','cancelled','Cancelled',40,false,true,false,'#f2555a',null),
  ('subscription','expired','Expired',50,false,true,false,'#5c647a',null),
  -- payment
  ('payment','created','Created',10,true,false,false,'#8b93a8',null),
  ('payment','authorized','Authorized',20,false,false,false,'#4f9cf9',null),
  ('payment','captured','Captured',30,false,false,false,'#0A9C49',null),
  ('payment','failed','Failed',40,false,true,true,'#f2555a',null),
  ('payment','partially_refunded','Partially Refunded',50,false,false,false,'#b794f6',null),
  ('payment','refunded','Refunded',60,false,true,false,'#b794f6',null),
  ('payment','disputed','Disputed',70,false,false,true,'#ff8c42',null),
  -- payout
  ('payout','pending','Pending',10,true,false,false,'#8b93a8',null),
  ('payout','approved','Approved',20,false,false,false,'#4f9cf9',null),
  ('payout','processing','Processing',30,false,false,false,'#FEA707',null),
  ('payout','paid','Paid',40,false,true,false,'#0A9C49',null),
  ('payout','failed','Failed',50,false,false,true,'#f2555a',null),
  ('payout','cancelled','Cancelled',60,false,true,false,'#5c647a',null),
  -- trip
  ('trip','scheduled','Scheduled',10,true,false,false,'#4f9cf9',null),
  ('trip','ready','Ready',20,false,false,false,'#4f9cf9',null),
  ('trip','in_progress','In Progress',30,false,false,false,'#FEA707',null),
  ('trip','delayed','Delayed',40,false,false,true,'#ff8c42',null),
  ('trip','completed','Completed',50,false,true,false,'#0A9C49',null),
  ('trip','cancelled','Cancelled',60,false,true,false,'#f2555a',null),
  -- trip_child
  ('trip_child','pending','Pending',10,true,false,false,'#8b93a8','⏳'),
  ('trip_child','absent','Absent',20,false,true,false,'#ff8c42','🏠'),
  ('trip_child','picked_up','Picked Up',30,false,false,false,'#0A9C49','⬆️'),
  ('trip_child','at_school','At School',40,false,false,false,'#4f9cf9','🏫'),
  ('trip_child','dropped_off','Dropped Off',50,false,true,false,'#0A9C49','⬇️'),
  ('trip_child','no_show','No Show',60,false,true,true,'#f2555a','🚫'),
  ('trip_child','exception','Exception',70,false,false,true,'#f2555a','⚠️'),
  -- incident
  ('incident','open','Open',10,true,false,false,'#f2555a',null),
  ('incident','triaged','Triaged',20,false,false,false,'#FEA707',null),
  ('incident','investigating','Investigating',30,false,false,false,'#FEA707',null),
  ('incident','contained','Contained',40,false,false,false,'#4f9cf9',null),
  ('incident','resolved','Resolved',50,false,false,false,'#0A9C49',null),
  ('incident','closed','Closed',60,false,true,false,'#8b93a8',null),
  -- exception queue
  ('exception','open','Open',10,true,false,false,'#f2555a',null),
  ('exception','acknowledged','Acknowledged',20,false,false,false,'#FEA707',null),
  ('exception','in_progress','In Progress',30,false,false,false,'#4f9cf9',null),
  ('exception','resolved','Resolved',40,false,true,false,'#0A9C49',null),
  ('exception','cancelled','Cancelled',50,false,true,false,'#5c647a',null),
  -- ticket
  ('ticket','open','Open',10,true,false,false,'#FEA707',null),
  ('ticket','in_progress','In Progress',20,false,false,false,'#4f9cf9',null),
  ('ticket','waiting_on_user','Waiting on User',30,false,false,false,'#8b93a8',null),
  ('ticket','resolved','Resolved',40,false,false,false,'#0A9C49',null),
  ('ticket','closed','Closed',50,false,true,false,'#5c647a',null),
  -- reassignment
  ('reassignment','pending','Pending',10,true,false,false,'#FEA707',null),
  ('reassignment','approved','Approved',20,false,false,false,'#0A9C49',null),
  ('reassignment','rejected','Rejected',30,false,true,true,'#f2555a',null),
  ('reassignment','completed','Completed',40,false,true,false,'#4f9cf9',null),
  ('reassignment','cancelled','Cancelled',50,false,true,false,'#5c647a',null);

insert into public.state_transitions (domain, from_code, to_code, allowed_roles) values
  -- booking
  ('booking','draft','pending_reservation',array['parent']),
  ('booking','pending_reservation','awaiting_payment',null),
  ('booking','pending_reservation','expired',null),
  ('booking','awaiting_payment','awaiting_review',null),
  ('booking','awaiting_payment','confirmed',null),
  ('booking','awaiting_payment','expired',null),
  ('booking','awaiting_payment','cancelled',array['parent','operator','admin']),
  ('booking','awaiting_review','confirmed',array['operator','admin']),
  ('booking','awaiting_review','cancelled',array['operator','admin']),
  ('booking','confirmed','active',null),
  ('booking','confirmed','cancelled',array['parent','operator','admin']),
  ('booking','confirmed','suspended',array['operator','admin']),
  ('booking','active','suspended',array['operator','admin']),
  ('booking','active','cancelled',array['parent','operator','admin']),
  ('booking','active','completed',null),
  ('booking','suspended','active',array['operator','admin']),
  ('booking','suspended','cancelled',array['operator','admin']),
  -- trip
  ('trip','scheduled','ready',array['driver']),
  ('trip','scheduled','cancelled',array['operator','admin']),
  ('trip','ready','in_progress',array['driver']),
  ('trip','ready','cancelled',array['operator','admin']),
  ('trip','in_progress','delayed',array['driver','operator','admin']),
  ('trip','delayed','in_progress',array['driver','operator','admin']),
  ('trip','in_progress','completed',array['driver','operator','admin']),
  ('trip','delayed','completed',array['driver','operator','admin']),
  ('trip','in_progress','cancelled',array['operator','admin']),
  ('trip','delayed','cancelled',array['operator','admin']),
  -- trip_child
  ('trip_child','pending','absent',array['parent','operator','admin','driver']),
  ('trip_child','pending','picked_up',array['driver']),
  ('trip_child','pending','no_show',array['driver','operator','admin']),
  ('trip_child','pending','exception',null),
  ('trip_child','picked_up','at_school',array['school_staff','driver','operator','admin']),
  ('trip_child','picked_up','dropped_off',array['driver']),
  ('trip_child','picked_up','exception',null),
  ('trip_child','at_school','dropped_off',array['driver']),
  ('trip_child','at_school','exception',null),
  ('trip_child','exception','picked_up',array['operator','admin']),
  ('trip_child','exception','dropped_off',array['operator','admin']),
  ('trip_child','exception','no_show',array['operator','admin']),
  -- driver
  ('driver','pending_verification','approved',array['admin','kyc_reviewer']),
  ('driver','pending_verification','needs_resubmission',array['admin','kyc_reviewer']),
  ('driver','pending_verification','rejected',array['admin','kyc_reviewer']),
  ('driver','needs_resubmission','pending_verification',array['driver']),
  ('driver','needs_resubmission','rejected',array['admin','kyc_reviewer']),
  ('driver','approved','suspended',array['admin','kyc_reviewer','operator']),
  ('driver','approved','inactive',array['admin','driver']),
  ('driver','suspended','approved',array['admin','kyc_reviewer']),
  ('driver','suspended','rejected',array['admin','kyc_reviewer']),
  -- vehicle
  ('vehicle','pending_verification','approved',array['admin','kyc_reviewer']),
  ('vehicle','pending_verification','needs_resubmission',array['admin','kyc_reviewer']),
  ('vehicle','needs_resubmission','pending_verification',array['vehicle_owner','driver']),
  ('vehicle','approved','maintenance',array['vehicle_owner','driver','operator','admin']),
  ('vehicle','maintenance','approved',array['vehicle_owner','operator','admin']),
  ('vehicle','approved','suspended',array['admin','kyc_reviewer','operator']),
  ('vehicle','suspended','approved',array['admin','kyc_reviewer']),
  ('vehicle','approved','retired',array['vehicle_owner','admin']),
  -- route
  ('route','draft','pending_review',array['driver','vehicle_owner','operator']),
  ('route','pending_review','approved',array['admin','operator']),
  ('route','pending_review','needs_changes',array['admin','operator']),
  ('route','needs_changes','pending_review',array['driver','vehicle_owner','operator']),
  ('route','approved','paused',array['admin','operator']),
  ('route','paused','approved',array['admin','operator']),
  ('route','approved','archived',array['admin','operator']),
  ('route','paused','archived',array['admin','operator']);

-- Generic guard: any table with (domain-bound) state column can call this.
create or replace function app.assert_transition(p_domain text, p_from text, p_to text)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_from is null or p_from = p_to then
    return;
  end if;
  if not exists (
    select 1 from public.state_transitions st
    where st.domain = p_domain and st.from_code = p_from and st.to_code = p_to
  ) then
    raise exception 'Illegal % transition: % -> %', p_domain, p_from, p_to
      using errcode = 'check_violation';
  end if;
end; $$;

create or replace function app.enforce_state_machine()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_domain text := tg_argv[0];
  v_col    text := coalesce(tg_argv[1], 'state');
  v_old    text;
  v_new    text;
begin
  execute format('select ($1).%I, ($2).%I', v_col, v_col)
    into v_old, v_new using old, new;
  perform app.assert_transition(v_domain, v_old, v_new);
  return new;
end; $$;
-- =============================================================================
--  TinyRide v3 schema — 02 · Identity, family, schools, geography
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Geography / pilot scoping (deterministic matching needs real zones)
-- -----------------------------------------------------------------------------
set search_path = public, extensions;

create table public.cities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  timezone   text not null default 'Asia/Kolkata',
  currency   char(3) not null default 'INR',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.zones (
  id         uuid primary key default gen_random_uuid(),
  city_id    uuid not null references public.cities(id) on delete restrict,
  name       text not null,
  boundary   geography(MultiPolygon, 4326),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (city_id, name)
);
create index idx_zones_boundary on public.zones using gist(boundary);

-- -----------------------------------------------------------------------------
-- Identity
-- -----------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete restrict,
  display_name  text,
  -- OTP auth is phone-first: store normalised E.164 and enforce uniqueness.
  phone_e164    text not null,
  email         citext,
  city_id       uuid references public.cities(id) on delete set null,
  locale        text not null default 'en-IN',
  state         text not null default 'active',
  state_domain  text generated always as ('profile') stored,
  suspended_reason text,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_profiles_phone check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint fk_profiles_state foreign key (state_domain, state)
    references public.states(domain, code)
);
create unique index uq_profiles_phone on public.profiles(phone_e164) where deleted_at is null;
create unique index uq_profiles_email on public.profiles(email) where email is not null and deleted_at is null;
create index idx_profiles_state on public.profiles(state);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function app.set_updated_at();
create trigger profiles_state_machine before update on public.profiles
  for each row execute function app.enforce_state_machine('profile','state');

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  is_privileged boolean not null default false,   -- requires MFA + audit
  description text
);
insert into public.roles (code, name, is_privileged) values
  ('parent','Parent / Guardian',false),
  ('driver','Driver',false),
  ('vehicle_owner','Vehicle Owner',false),
  ('school_staff','School Staff',false),
  ('operator','Operations / Dispatcher',true),
  ('kyc_reviewer','KYC & Safety Reviewer',true),
  ('finance_admin','Finance Admin',true),
  ('support_agent','Support Agent',true),
  ('admin','Administrator',true);

create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role_id    uuid not null references public.roles(id) on delete restrict,
  active     boolean not null generated always as (revoked_at is null) stored,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  reason     text,
  constraint chk_user_roles_revoke check (revoked_at is null or revoked_at >= granted_at)
);
-- A role may be granted again after revocation, so uniqueness is on live grants.
create unique index uq_user_roles_live on public.user_roles(user_id, role_id) where revoked_at is null;
create index idx_user_roles_user on public.user_roles(user_id) where revoked_at is null;
create index idx_user_roles_role on public.user_roles(role_id) where revoked_at is null;

-- Versioned policy documents; consents point at a real version, not free text.
create table public.policy_documents (
  id            uuid primary key default gen_random_uuid(),
  consent_type  consent_type not null,
  version       text not null,
  effective_from timestamptz not null default now(),
  storage_path  text,
  body_md       text,
  created_at    timestamptz not null default now(),
  unique (consent_type, version)
);

create table public.consents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  policy_id    uuid not null references public.policy_documents(id) on delete restrict,
  accepted_at  timestamptz not null default now(),
  withdrawn_at timestamptz,
  ip_address   inet,
  user_agent   text,
  unique (user_id, policy_id),
  constraint chk_consents_withdraw check (withdrawn_at is null or withdrawn_at >= accepted_at)
);
create index idx_consents_user on public.consents(user_id);
-- Consent records are evidence: never edited in place, only withdrawn.
create trigger consents_no_delete before delete on public.consents
  for each row execute function app.forbid_mutation();

-- Push/SMS delivery targets. Needed for notification fan-out and for
-- "clear offline data on logout/revocation".
create table public.user_devices (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  platform       text not null check (platform in ('ios','android','web')),
  push_token     text not null,
  app_version    text,
  last_seen_at   timestamptz not null default now(),
  revoked_at     timestamptz,
  created_at     timestamptz not null default now(),
  unique (push_token)
);
create index idx_user_devices_user on public.user_devices(user_id) where revoked_at is null;

-- -----------------------------------------------------------------------------
-- Family
-- -----------------------------------------------------------------------------
create table public.parents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles(id) on delete restrict,
  city_id    uuid references public.cities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger parents_updated_at before update on public.parents
  for each row execute function app.set_updated_at();

-- Saved home / pickup / drop points. v2 had no place for these even though the
-- PRD makes them part of family setup and discovery.
create table public.family_locations (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.parents(id) on delete cascade,
  label      text not null,
  address    text not null,
  landmark   text,
  geo        geography(Point, 4326) not null,
  zone_id    uuid references public.zones(id) on delete set null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, label)
);
create index idx_family_locations_parent on public.family_locations(parent_id);
create index idx_family_locations_geo on public.family_locations using gist(geo);
create unique index uq_family_locations_default on public.family_locations(parent_id) where is_default;
create trigger family_locations_updated_at before update on public.family_locations
  for each row execute function app.set_updated_at();

create table public.children (
  id             uuid primary key default gen_random_uuid(),
  parent_id      uuid not null references public.parents(id) on delete restrict,
  school_id      uuid,                       -- FK added after schools
  first_name     text not null,
  last_name      text,
  date_of_birth  date not null,
  grade          text,
  section        text,
  school_roll_no text,
  photo_path     text,
  status         text not null default 'active' check (status in ('active','inactive','graduated')),
  home_location_id uuid references public.family_locations(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint chk_children_dob check (date_of_birth > current_date - interval '25 years'
                                     and date_of_birth < current_date)
);
create index idx_children_parent on public.children(parent_id);
create index idx_children_school on public.children(school_id);
create trigger children_updated_at before update on public.children
  for each row execute function app.set_updated_at();

-- Medical / special-needs data is the most sensitive field in the product.
-- It lives in its own table so it can carry its own RLS policy and its own
-- retention rule instead of riding along in children.notes jsonb.
create table public.child_health_notes (
  child_id       uuid primary key references public.children(id) on delete cascade,
  allergies      text,
  medical_notes  text,
  special_needs  text,
  emergency_instructions text,
  consent_id     uuid references public.consents(id) on delete set null,
  updated_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger child_health_notes_updated_at before update on public.child_health_notes
  for each row execute function app.set_updated_at();

create table public.guardians (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.parents(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete set null,
  full_name    text not null,
  phone_e164   text not null,
  photo_path   text,
  id_proof_path text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint chk_guardians_phone check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  unique (parent_id, phone_e164)
);
create index idx_guardians_parent on public.guardians(parent_id);
create index idx_guardians_user on public.guardians(user_id);
create trigger guardians_updated_at before update on public.guardians
  for each row execute function app.set_updated_at();

create table public.child_guardians (
  id                   uuid primary key default gen_random_uuid(),
  child_id             uuid not null references public.children(id) on delete cascade,
  guardian_id          uuid not null references public.guardians(id) on delete cascade,
  relationship         guardian_relationship not null,
  priority             int not null default 1 check (priority between 1 and 10),
  can_pickup           boolean not null default false,
  is_emergency_contact boolean not null default false,
  -- PRD: handovers may only be released to *verified* pre-authorized guardians.
  verified_at          timestamptz,
  verified_by          uuid references public.profiles(id) on delete set null,
  revoked_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (child_id, guardian_id),
  constraint chk_child_guardian_pickup_verified
    check (not can_pickup or verified_at is not null)
);
create unique index uq_child_guardian_priority on public.child_guardians(child_id, priority)
  where revoked_at is null;
create index idx_child_guardians_child on public.child_guardians(child_id) where revoked_at is null;
create index idx_child_guardians_guardian on public.child_guardians(guardian_id);
create index idx_child_guardians_emergency on public.child_guardians(child_id)
  where is_emergency_contact and revoked_at is null;
create trigger child_guardians_updated_at before update on public.child_guardians
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Schools
-- -----------------------------------------------------------------------------
create table public.schools (
  id                  uuid primary key default gen_random_uuid(),
  city_id             uuid not null references public.cities(id) on delete restrict,
  zone_id             uuid references public.zones(id) on delete set null,
  name                text not null,
  address             text,
  geo                 geography(Point, 4326),
  contact_phone_e164  text,
  status              text not null default 'active' check (status in ('active','inactive','archived')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified','rejected')),
  verified_by         uuid references public.profiles(id) on delete set null,
  verified_at         timestamptz,
  am_arrive_by        time,     -- school gate cut-off, drives schedule validation
  pm_release_at       time,
  timezone            text not null default 'Asia/Kolkata',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint chk_schools_verified check (
    (verification_status = 'verified') = (verified_at is not null)
  )
);
create index idx_schools_verification on public.schools(verification_status);
create index idx_schools_name_trgm on public.schools using gin(name gin_trgm_ops);
create index idx_schools_geo on public.schools using gist(geo);
create trigger schools_updated_at before update on public.schools
  for each row execute function app.set_updated_at();

alter table public.children
  add constraint fk_children_school
  foreign key (school_id) references public.schools(id) on delete restrict;

create table public.school_users (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  staff_role  school_staff_role not null default 'viewer',
  invited_by  uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create unique index uq_school_users_live on public.school_users(school_id, user_id) where revoked_at is null;
create index idx_school_users_user on public.school_users(user_id) where revoked_at is null;

-- Holidays / half-days: trip generation must not create trips on these dates.
create table public.school_calendar_days (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  calendar_date date not null,
  day_type    text not null check (day_type in ('holiday','half_day','exam','working')),
  am_arrive_by time,
  pm_release_at time,
  note        text,
  unique (school_id, calendar_date)
);
create index idx_school_calendar_date on public.school_calendar_days(calendar_date);
-- =============================================================================
--  TinyRide v3 schema — 03 · Drivers, owners, vehicles, documents, verification
-- =============================================================================

set search_path = public, extensions;

create table public.drivers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references public.profiles(id) on delete restrict,
  city_id           uuid references public.cities(id) on delete set null,
  license_number    text not null,
  license_expires_at date,
  state             text not null default 'pending_verification',
  state_domain      text generated always as ('driver') stored,
  suspended_reason  text,
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint fk_drivers_state foreign key (state_domain, state)
    references public.states(domain, code),
  constraint chk_drivers_approved check ((state = 'approved') <= (approved_at is not null))
);
create unique index uq_drivers_license on public.drivers(upper(replace(license_number,' ','')));
create index idx_drivers_state on public.drivers(state);
create trigger drivers_updated_at before update on public.drivers
  for each row execute function app.set_updated_at();
create trigger drivers_state_machine before update on public.drivers
  for each row execute function app.enforce_state_machine('driver','state');

create table public.vehicle_owners (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles(id) on delete restrict,
  legal_name text,
  pan_or_gstin text,
  payout_account_ref text,           -- tokenised bank reference, never raw account data
  status     text not null default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger vehicle_owners_updated_at before update on public.vehicle_owners
  for each row execute function app.set_updated_at();

create table public.vehicles (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.vehicle_owners(id) on delete restrict,
  registration_number text not null,
  make_model          text,
  vehicle_type        text check (vehicle_type in ('auto','van','minibus','car')),
  seating_capacity    int not null check (seating_capacity > 0),
  -- usable_capacity is the *approved* child capacity; it is the only number
  -- booking capacity checks may use.
  usable_capacity     int not null check (usable_capacity > 0),
  has_attendant       boolean not null default false,
  fitness_expires_at  date,
  insurance_expires_at date,
  permit_expires_at   date,
  state               text not null default 'pending_verification',
  state_domain        text generated always as ('vehicle') stored,
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint chk_vehicles_capacity check (usable_capacity <= seating_capacity),
  constraint fk_vehicles_state foreign key (state_domain, state)
    references public.states(domain, code)
);
create unique index uq_vehicles_registration on public.vehicles(upper(replace(registration_number,' ','')));
create index idx_vehicles_owner on public.vehicles(owner_id);
create index idx_vehicles_state on public.vehicles(state);
create index idx_vehicles_doc_expiry on public.vehicles
  (least(fitness_expires_at, insurance_expires_at, permit_expires_at));
create trigger vehicles_updated_at before update on public.vehicles
  for each row execute function app.set_updated_at();
create trigger vehicles_state_machine before update on public.vehicles
  for each row execute function app.enforce_state_machine('vehicle','state');

-- Driver<->vehicle authorisation is time-bounded and owner-attested
-- (PRD: "maintain evidence of driver-to-vehicle assignment validity").
create table public.driver_vehicle_assignments (
  id                 uuid primary key default gen_random_uuid(),
  driver_id          uuid not null references public.drivers(id) on delete restrict,
  vehicle_id         uuid not null references public.vehicles(id) on delete restrict,
  assignment_type    assignment_type not null default 'primary',
  valid_from         date not null default current_date,
  valid_to           date,
  validity           daterange generated always as
                       (daterange(valid_from, valid_to, '[)')) stored,
  authorized_by_owner uuid references public.profiles(id) on delete set null,
  authorized_at      timestamptz,
  evidence_document_id uuid,            -- FK added after documents
  revoked_at         timestamptz,
  created_at         timestamptz not null default now(),
  constraint chk_dva_dates check (valid_to is null or valid_to > valid_from),
  -- One live primary vehicle per driver at any point in time.
  constraint excl_dva_primary exclude using gist (
    driver_id with =, validity with &&
  ) where (assignment_type = 'primary' and revoked_at is null)
);
create index idx_dva_driver on public.driver_vehicle_assignments(driver_id) where revoked_at is null;
create index idx_dva_vehicle on public.driver_vehicle_assignments(vehicle_id) where revoked_at is null;

-- -----------------------------------------------------------------------------
-- Documents: versioned, subject-tagged, privately stored
-- -----------------------------------------------------------------------------
create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  subject_type   document_subject not null,
  driver_id      uuid references public.drivers(id) on delete cascade,
  vehicle_id     uuid references public.vehicles(id) on delete cascade,
  owner_id       uuid references public.vehicle_owners(id) on delete cascade,
  school_id      uuid references public.schools(id) on delete cascade,
  document_type  document_type not null,
  version        int not null default 1 check (version > 0),
  supersedes_id  uuid references public.documents(id) on delete set null,
  storage_path   text not null,
  checksum_sha256 text,
  issued_on      date,
  expires_at     date,
  review_status  text not null default 'pending'
                   check (review_status in ('pending','approved','rejected','superseded')),
  uploaded_by    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Exactly one subject, and it must match subject_type.
  constraint chk_documents_one_subject check (
    (driver_id is not null)::int + (vehicle_id is not null)::int
    + (owner_id is not null)::int + (school_id is not null)::int = 1
  ),
  constraint chk_documents_subject_match check (
    (subject_type = 'driver'  and driver_id  is not null) or
    (subject_type = 'vehicle' and vehicle_id is not null) or
    (subject_type = 'owner'   and owner_id   is not null) or
    (subject_type = 'school'  and school_id  is not null)
  )
);
create unique index uq_documents_driver_version on public.documents(driver_id, document_type, version)
  where driver_id is not null;
create unique index uq_documents_vehicle_version on public.documents(vehicle_id, document_type, version)
  where vehicle_id is not null;
create index idx_documents_driver on public.documents(driver_id) where driver_id is not null;
create index idx_documents_vehicle on public.documents(vehicle_id) where vehicle_id is not null;
-- Drives the "documents nearing expiry" ops queue.
create index idx_documents_expiry on public.documents(expires_at)
  where review_status = 'approved' and expires_at is not null;
create trigger documents_updated_at before update on public.documents
  for each row execute function app.set_updated_at();

alter table public.driver_vehicle_assignments
  add constraint fk_dva_evidence foreign key (evidence_document_id)
  references public.documents(id) on delete set null;

-- Every approval/rejection/suspension is an immutable evidence record pinned to
-- the exact document version that was reviewed.
create table public.verification_reviews (
  id               uuid primary key default gen_random_uuid(),
  subject_type     review_subject not null,
  driver_id        uuid references public.drivers(id) on delete cascade,
  vehicle_id       uuid references public.vehicles(id) on delete cascade,
  owner_id         uuid references public.vehicle_owners(id) on delete cascade,
  route_id         uuid,                     -- FK added after routes
  school_id        uuid references public.schools(id) on delete cascade,
  document_id      uuid references public.documents(id) on delete set null,
  reviewer_user_id uuid not null references public.profiles(id) on delete restrict,
  decision         verification_decision not null,
  reason_code      text,
  notes            text,
  reviewed_at      timestamptz not null default now(),
  constraint chk_vr_one_subject check (
    (driver_id is not null)::int + (vehicle_id is not null)::int
    + (owner_id is not null)::int + (route_id is not null)::int
    + (school_id is not null)::int = 1
  ),
  constraint chk_vr_reason check (decision = 'approved' or reason_code is not null)
);
create index idx_vr_driver on public.verification_reviews(driver_id) where driver_id is not null;
create index idx_vr_vehicle on public.verification_reviews(vehicle_id) where vehicle_id is not null;
create index idx_vr_route on public.verification_reviews(route_id) where route_id is not null;
create index idx_vr_reviewer on public.verification_reviews(reviewer_user_id, reviewed_at desc);
create trigger verification_reviews_append_only
  before update or delete on public.verification_reviews
  for each row execute function app.forbid_mutation();
-- =============================================================================
--  TinyRide v3 schema — 04 · Routes, schedules, stops, pricing
--
--  Key modelling change vs v2: the *schedule* (a route + direction + time
--  window) is the sellable, operable unit. Bookings, capacity, trips and
--  stop ordering all hang off route_schedules, not off routes. Without this an
--  AM booking silently produces PM trip rows.
-- =============================================================================

set search_path = public, extensions;

create table public.routes (
  id                uuid primary key default gen_random_uuid(),
  city_id           uuid not null references public.cities(id) on delete restrict,
  school_id         uuid not null references public.schools(id) on delete restrict,
  zone_id           uuid references public.zones(id) on delete set null,
  name              text not null,
  proposed_by       uuid not null references public.profiles(id) on delete restrict,
  owner_id          uuid references public.vehicle_owners(id) on delete restrict,
  state             text not null default 'draft',
  state_domain      text generated always as ('route') stored,
  service_area      geography(MultiPolygon, 4326),
  max_detour_minutes int not null default 15 check (max_detour_minutes between 0 and 120),
  approved_at       timestamptz,
  approved_by       uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint fk_routes_state foreign key (state_domain, state)
    references public.states(domain, code),
  constraint chk_routes_approved check ((state = 'approved') <= (approved_at is not null))
);
create index idx_routes_school_state on public.routes(school_id, state);
create index idx_routes_zone on public.routes(zone_id);
create index idx_routes_owner on public.routes(owner_id);
create index idx_routes_service_area on public.routes using gist(service_area);
create trigger routes_updated_at before update on public.routes
  for each row execute function app.set_updated_at();
create trigger routes_state_machine before update on public.routes
  for each row execute function app.enforce_state_machine('route','state');

alter table public.verification_reviews
  add constraint fk_vr_route foreign key (route_id) references public.routes(id) on delete cascade;

create table public.route_stops (
  id           uuid primary key default gen_random_uuid(),
  route_id     uuid not null references public.routes(id) on delete cascade,
  stop_type    stop_type not null default 'pickup',
  name         text not null,
  address      text not null,
  geo          geography(Point, 4326) not null,
  zone_id      uuid references public.zones(id) on delete set null,
  school_id    uuid references public.schools(id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint chk_route_stops_school check ((stop_type = 'school') = (school_id is not null)),
  -- Enables composite FKs so a booking can never point at another route's stop.
  unique (id, route_id)
);
create index idx_route_stops_route on public.route_stops(route_id);
create index idx_route_stops_geo on public.route_stops using gist(geo);
create trigger route_stops_updated_at before update on public.route_stops
  for each row execute function app.set_updated_at();

create table public.route_schedules (
  id                uuid primary key default gen_random_uuid(),
  route_id          uuid not null references public.routes(id) on delete cascade,
  name              text not null,                       -- 'Morning Run'
  direction         trip_direction not null,
  departure_time    time not null,
  arrival_time      time,
  timezone          text not null default 'Asia/Kolkata',
  days_of_week      smallint[] not null default '{1,2,3,4,5}',  -- ISO 1=Mon..7=Sun
  -- Seats offered on this run. Validated against the assigned vehicle's
  -- usable_capacity by trigger, and is the number booking capacity checks use.
  seats_offered     int not null check (seats_offered > 0),
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (route_id, direction, departure_time),
  constraint chk_schedule_days check (
    array_length(days_of_week,1) between 1 and 7
    and days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]
  ),
  constraint chk_schedule_times check (arrival_time is null or arrival_time <> departure_time),
  -- Composite target for booking FKs.
  unique (id, route_id)
);
create index idx_route_schedules_route on public.route_schedules(route_id) where active;
create index idx_route_schedules_days on public.route_schedules using gin(days_of_week);
create trigger route_schedules_updated_at before update on public.route_schedules
  for each row execute function app.set_updated_at();

-- Stop order and planned times differ between AM and PM, so ordering belongs to
-- the schedule, not the route.
create table public.route_schedule_stops (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.route_schedules(id) on delete cascade,
  route_id     uuid not null,
  stop_id      uuid not null,
  sequence_no  int not null check (sequence_no > 0),
  planned_time time,
  created_at   timestamptz not null default now(),
  unique (schedule_id, sequence_no),
  unique (schedule_id, stop_id),
  foreign key (stop_id, route_id) references public.route_stops(id, route_id) on delete cascade,
  foreign key (schedule_id, route_id) references public.route_schedules(id, route_id) on delete cascade
);
create index idx_rss_schedule on public.route_schedule_stops(schedule_id, sequence_no);

-- Price is versioned; a booking pins the exact price row it was sold at
-- (PRD: "price snapshot").
create table public.route_prices (
  id             uuid primary key default gen_random_uuid(),
  schedule_id    uuid not null references public.route_schedules(id) on delete cascade,
  billing_period billing_period not null default 'monthly',
  amount_minor   bigint not null check (amount_minor >= 0),   -- paise
  currency       char(3) not null default 'INR',
  effective_from timestamptz not null default now(),
  effective_to   timestamptz,
  approved_by    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint chk_route_prices_window check (effective_to is null or effective_to > effective_from),
  constraint excl_route_prices exclude using gist (
    schedule_id with =, billing_period with =,
    tstzrange(effective_from, effective_to, '[)') with &&
  )
);
create index idx_route_prices_schedule on public.route_prices(schedule_id);

-- Which driver+vehicle operate a schedule, over a validity window. Replaces
-- v2's unbounded route_assignments (which allowed two live drivers per route).
create table public.route_assignments (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.route_schedules(id) on delete cascade,
  driver_id    uuid not null references public.drivers(id) on delete restrict,
  vehicle_id   uuid not null references public.vehicles(id) on delete restrict,
  assignment_type assignment_type not null default 'primary',
  valid_from   date not null default current_date,
  valid_to     date,
  validity     daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  assigned_by  uuid references public.profiles(id) on delete set null,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint chk_ra_dates check (valid_to is null or valid_to > valid_from),
  -- At most one primary driver/vehicle pair per schedule at a time...
  constraint excl_ra_schedule exclude using gist (
    schedule_id with =, validity with &&
  ) where (assignment_type = 'primary' and revoked_at is null),
  -- ...and a driver cannot be the primary on two schedules that overlap in time.
  constraint excl_ra_driver exclude using gist (
    driver_id with =, validity with &&
  ) where (assignment_type = 'primary' and revoked_at is null)
);
create index idx_ra_driver on public.route_assignments(driver_id) where revoked_at is null;
create index idx_ra_vehicle on public.route_assignments(vehicle_id) where revoked_at is null;
create index idx_ra_schedule on public.route_assignments(schedule_id) where revoked_at is null;

-- Supply guard: only approved driver+vehicle may be assigned, the vehicle must
-- be authorised for that driver, and seats_offered may not exceed the vehicle's
-- approved usable capacity (PRD: routes may not exceed approved usable capacity).
create or replace function app.validate_route_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_driver_state text;
  v_vehicle_state text;
  v_usable int;
  v_seats int;
  -- NEW.validity is a generated column and is not yet populated in a BEFORE
  -- trigger, so recompute the window here.
  v_validity daterange := daterange(new.valid_from, new.valid_to, '[)');
begin
  select state into v_driver_state from public.drivers where id = new.driver_id;
  select state, usable_capacity into v_vehicle_state, v_usable
    from public.vehicles where id = new.vehicle_id;
  select seats_offered into v_seats from public.route_schedules where id = new.schedule_id;

  if v_driver_state <> 'approved' then
    raise exception 'Driver % is not approved (state=%)', new.driver_id, v_driver_state
      using errcode = 'check_violation';
  end if;
  if v_vehicle_state <> 'approved' then
    raise exception 'Vehicle % is not approved (state=%)', new.vehicle_id, v_vehicle_state
      using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from public.driver_vehicle_assignments dva
    where dva.driver_id = new.driver_id
      and dva.vehicle_id = new.vehicle_id
      and dva.revoked_at is null
      and dva.authorized_at is not null
      and dva.validity && v_validity
  ) then
    raise exception 'Driver % is not owner-authorised for vehicle %', new.driver_id, new.vehicle_id
      using errcode = 'check_violation';
  end if;
  if v_seats > v_usable then
    raise exception 'Schedule offers % seats but vehicle usable capacity is %', v_seats, v_usable
      using errcode = 'check_violation';
  end if;
  return new;
end; $$;

create trigger route_assignments_validate
  before insert or update on public.route_assignments
  for each row execute function app.validate_route_assignment();
-- =============================================================================
--  TinyRide v3 schema — 05 · Seat holds, bookings, subscriptions, capacity
--
--  Oversell prevention (PRD Phase 3 exit criterion "no oversell") is enforced
--  in the database, not only in application code:
--    * every schedule has a counter row locked FOR UPDATE before any change;
--    * seats_taken = live holds + seats of bookings in seat-consuming states;
--    * a CHECK on the counter makes oversell physically impossible.
-- =============================================================================

set search_path = public, extensions;

create table public.seat_holds (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.route_schedules(id) on delete cascade,
  parent_id    uuid not null references public.parents(id) on delete cascade,
  child_id     uuid not null references public.children(id) on delete cascade,
  seat_count   int not null default 1 check (seat_count > 0),
  expires_at   timestamptz not null,
  released_at  timestamptz,
  booking_id   uuid,                        -- set when the hold converts
  created_at   timestamptz not null default now(),
  constraint chk_seat_holds_expiry check (expires_at > created_at)
);
-- One live hold per child per schedule.
create unique index uq_seat_holds_live on public.seat_holds(schedule_id, child_id)
  where released_at is null;
create index idx_seat_holds_sweep on public.seat_holds(expires_at) where released_at is null;
create index idx_seat_holds_schedule on public.seat_holds(schedule_id) where released_at is null;

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid not null references public.parents(id) on delete restrict,
  child_id         uuid not null references public.children(id) on delete restrict,
  route_id         uuid not null references public.routes(id) on delete restrict,
  schedule_id      uuid not null,
  pickup_stop_id   uuid not null,
  dropoff_stop_id  uuid not null,
  seat_count       int not null default 1 check (seat_count > 0),
  -- Service window: a booking is not "forever"; trip generation and billing
  -- both need to know when it starts and stops.
  service_start    date not null,
  service_end      date,
  price_id         uuid references public.route_prices(id) on delete restrict,
  amount_minor     bigint not null check (amount_minor >= 0),
  currency         char(3) not null default 'INR',
  billing_period   billing_period not null default 'monthly',
  state            text not null default 'draft',
  state_domain     text generated always as ('booking') stored,
  seat_hold_id     uuid references public.seat_holds(id) on delete set null,
  confirmed_at     timestamptz,
  cancelled_at     timestamptz,
  cancel_reason_code text,
  cancelled_by     uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint fk_bookings_state foreign key (state_domain, state)
    references public.states(domain, code),
  -- Stops and schedule must belong to the booked route.
  constraint fk_bookings_schedule foreign key (schedule_id, route_id)
    references public.route_schedules(id, route_id) on delete restrict,
  constraint fk_bookings_pickup foreign key (pickup_stop_id, route_id)
    references public.route_stops(id, route_id) on delete restrict,
  constraint fk_bookings_dropoff foreign key (dropoff_stop_id, route_id)
    references public.route_stops(id, route_id) on delete restrict,
  constraint chk_bookings_distinct_stops check (pickup_stop_id <> dropoff_stop_id),
  constraint chk_bookings_service_window check (service_end is null or service_end >= service_start),
  constraint chk_bookings_cancel check (
    (state = 'cancelled') = (cancelled_at is not null)
  ),
  constraint chk_bookings_confirm check (
    state not in ('confirmed','active','completed') or confirmed_at is not null
  )
);
-- PRD: "revalidate ... duplicate booking". One live booking per child per run.
create unique index uq_bookings_live on public.bookings(child_id, schedule_id)
  where state in ('pending_reservation','awaiting_payment','awaiting_review','confirmed','active','suspended');
create index idx_bookings_parent_state on public.bookings(parent_id, state);
create index idx_bookings_child on public.bookings(child_id);
create index idx_bookings_schedule_state on public.bookings(schedule_id, state);
create index idx_bookings_seat_consuming on public.bookings(schedule_id)
  where state in ('pending_reservation','awaiting_payment','awaiting_review','confirmed','active');
create index idx_bookings_service_window on public.bookings(schedule_id, service_start, service_end)
  where state in ('confirmed','active');
create trigger bookings_updated_at before update on public.bookings
  for each row execute function app.set_updated_at();
create trigger bookings_state_machine before update on public.bookings
  for each row execute function app.enforce_state_machine('booking','state');

alter table public.seat_holds
  add constraint fk_seat_holds_booking foreign key (booking_id)
  references public.bookings(id) on delete set null;

create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  booking_id           uuid not null references public.bookings(id) on delete restrict,
  provider             text not null default 'razorpay',
  provider_subscription_id text,
  billing_period       billing_period not null default 'monthly',
  amount_minor         bigint not null check (amount_minor >= 0),
  currency             char(3) not null default 'INR',
  current_period_start date not null,
  current_period_end   date not null,
  next_renewal_date    date not null,
  cancel_at_period_end boolean not null default false,
  state                text not null default 'active',
  state_domain         text generated always as ('subscription') stored,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint fk_subscriptions_state foreign key (state_domain, state)
    references public.states(domain, code),
  constraint chk_subscription_period check (current_period_end > current_period_start)
);
create unique index uq_subscriptions_live on public.subscriptions(booking_id)
  where state in ('active','past_due','paused');
create unique index uq_subscriptions_provider on public.subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;
create index idx_subscriptions_renewal on public.subscriptions(next_renewal_date)
  where state in ('active','past_due');
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Capacity counter
-- -----------------------------------------------------------------------------
create table public.schedule_seat_counters (
  schedule_id   uuid primary key references public.route_schedules(id) on delete cascade,
  seats_offered int not null check (seats_offered > 0),
  seats_taken   int not null default 0 check (seats_taken >= 0),
  updated_at    timestamptz not null default now(),
  constraint chk_no_oversell check (seats_taken <= seats_offered)
);

create or replace function app.sync_schedule_counter()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.schedule_seat_counters (schedule_id, seats_offered)
  values (new.id, new.seats_offered)
  on conflict (schedule_id) do update set seats_offered = excluded.seats_offered,
                                          updated_at = now();
  return new;
end; $$;

create trigger route_schedules_counter
  after insert or update of seats_offered on public.route_schedules
  for each row execute function app.sync_schedule_counter();

-- Recomputes seats_taken under a row lock. Called by triggers on both
-- seat_holds and bookings, so concurrent checkouts serialise on one row.
create or replace function app.recount_schedule_seats(p_schedule_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_taken int;
begin
  perform 1 from public.schedule_seat_counters
    where schedule_id = p_schedule_id for update;

  select coalesce((
      select sum(seat_count) from public.seat_holds h
      where h.schedule_id = p_schedule_id
        and h.released_at is null
        and h.expires_at > now()
        and h.booking_id is null
    ), 0)
    + coalesce((
      select sum(seat_count) from public.bookings b
      where b.schedule_id = p_schedule_id
        and b.state in ('pending_reservation','awaiting_payment','awaiting_review','confirmed','active')
        and (b.service_end is null or b.service_end >= current_date)
    ), 0)
  into v_taken;

  update public.schedule_seat_counters
     set seats_taken = v_taken, updated_at = now()
   where schedule_id = p_schedule_id;
end; $$;

create or replace function app.trg_recount_seats()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform app.recount_schedule_seats(old.schedule_id);
    return null;
  end if;

  perform app.recount_schedule_seats(new.schedule_id);
  if tg_op = 'UPDATE' and old.schedule_id is distinct from new.schedule_id then
    perform app.recount_schedule_seats(old.schedule_id);
  end if;
  return null;
end; $$;

create trigger seat_holds_recount
  after insert or update or delete on public.seat_holds
  for each row execute function app.trg_recount_seats();
create trigger bookings_recount
  after insert or update or delete on public.bookings
  for each row execute function app.trg_recount_seats();

-- Transactional reservation entry point used by the API (PRD: "create a
-- short-lived transactional seat reservation" after revalidating eligibility).
create or replace function app.reserve_seat(
  p_child_id    uuid,
  p_schedule_id uuid,
  p_hold_minutes int default 10
)
returns public.seat_holds
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent_id uuid;
  v_route     record;
  v_hold      public.seat_holds;
begin
  select p.id into v_parent_id
    from public.children c join public.parents p on p.id = c.parent_id
   where c.id = p_child_id;
  if v_parent_id is null then
    raise exception 'Unknown child %', p_child_id using errcode = 'no_data_found';
  end if;

  select r.id as route_id, r.state as route_state, r.school_id, s.active
    into v_route
    from public.route_schedules s join public.routes r on r.id = s.route_id
   where s.id = p_schedule_id;

  if v_route.route_state <> 'approved' or not v_route.active then
    raise exception 'Schedule % is not bookable', p_schedule_id using errcode = 'check_violation';
  end if;
  if (select school_id from public.children where id = p_child_id) is distinct from v_route.school_id then
    raise exception 'Child school does not match route school' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.bookings b
    where b.child_id = p_child_id and b.schedule_id = p_schedule_id
      and b.state in ('pending_reservation','awaiting_payment','awaiting_review','confirmed','active','suspended')
  ) then
    raise exception 'Child already has a live booking on this schedule' using errcode = 'unique_violation';
  end if;

  insert into public.seat_holds (schedule_id, parent_id, child_id, expires_at)
  values (p_schedule_id, v_parent_id, p_child_id, now() + make_interval(mins => p_hold_minutes))
  returning * into v_hold;

  -- The counter CHECK aborts the transaction here if the run is full.
  return v_hold;
end; $$;
-- =============================================================================
--  TinyRide v3 schema — 06 · Payments, webhooks, ledger, payouts
--
--  Money is stored as integer minor units (paise) — never numeric(10,2) — and
--  every row carries its currency. The ledger is append-only double-entry-lite:
--  each financial event writes balanced entries against named accounts, so
--  reconciliation (PRD business metric) is a query, not a spreadsheet.
-- =============================================================================

set search_path = public, extensions;

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid references public.bookings(id) on delete restrict,
  subscription_id     uuid references public.subscriptions(id) on delete restrict,
  parent_id           uuid not null references public.parents(id) on delete restrict,
  provider            text not null default 'razorpay',
  provider_order_id   text,
  provider_payment_id text,
  amount_minor        bigint not null check (amount_minor >= 0),
  currency            char(3) not null default 'INR',
  period_start        date,
  period_end          date,
  status              text not null default 'created',
  status_domain       text generated always as ('payment') stored,
  failure_code        text,
  captured_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint fk_payments_status foreign key (status_domain, status)
    references public.states(domain, code),
  constraint chk_payments_subject check (booking_id is not null or subscription_id is not null),
  constraint chk_payments_period check (period_end is null or period_start is null
                                        or period_end >= period_start)
);
create unique index uq_payments_order on public.payments(provider, provider_order_id)
  where provider_order_id is not null;
create unique index uq_payments_provider_payment on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;
create index idx_payments_booking on public.payments(booking_id);
create index idx_payments_subscription on public.payments(subscription_id);
create index idx_payments_parent on public.payments(parent_id, created_at desc);
create index idx_payments_status on public.payments(status) where status <> 'captured';
create trigger payments_updated_at before update on public.payments
  for each row execute function app.set_updated_at();

-- Webhooks are authoritative and idempotent: the unique provider_event_id makes
-- a replay a no-op insert, and processing state is tracked explicitly so a
-- failed handler can be retried without double-applying.
create table public.payment_webhooks (
  id                 uuid primary key default gen_random_uuid(),
  provider           text not null default 'razorpay',
  provider_event_id  text not null,
  event_type         text not null,
  signature_verified boolean not null default false,
  payload            jsonb not null default '{}'::jsonb,
  payment_id         uuid references public.payments(id) on delete set null,
  received_at        timestamptz not null default now(),
  processed_at       timestamptz,
  processing_error   text,
  attempts           int not null default 0,
  unique (provider, provider_event_id)
);
create index idx_webhooks_unprocessed on public.payment_webhooks(received_at)
  where processed_at is null;
create index idx_webhooks_event_type on public.payment_webhooks(event_type);

create table public.ledger_accounts (
  id           uuid primary key default gen_random_uuid(),
  account_type ledger_account_type not null,
  parent_id    uuid references public.parents(id) on delete restrict,
  owner_id     uuid references public.vehicle_owners(id) on delete restrict,
  currency     char(3) not null default 'INR',
  created_at   timestamptz not null default now(),
  constraint chk_ledger_account_subject check (
    (account_type = 'parent_receivable' and parent_id is not null and owner_id is null) or
    (account_type = 'owner_payable'     and owner_id  is not null and parent_id is null) or
    (account_type in ('platform_revenue','gateway_clearing','cash')
       and parent_id is null and owner_id is null)
  )
);
create unique index uq_ledger_account_parent on public.ledger_accounts(parent_id, currency)
  where parent_id is not null;
create unique index uq_ledger_account_owner on public.ledger_accounts(owner_id, currency)
  where owner_id is not null;
create unique index uq_ledger_account_house on public.ledger_accounts(account_type, currency)
  where parent_id is null and owner_id is null;

-- A transaction groups the balanced entries of one financial event.
create table public.ledger_transactions (
  id             uuid primary key default gen_random_uuid(),
  entry_type     ledger_entry_type not null,
  currency       char(3) not null default 'INR',
  payment_id     uuid references public.payments(id) on delete restrict,
  payout_id      uuid,                                  -- FK added after payouts
  booking_id     uuid references public.bookings(id) on delete restrict,
  provider_ref   text,                                  -- refund id, UTR, ...
  description    text,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index idx_ledger_tx_payment on public.ledger_transactions(payment_id);
create index idx_ledger_tx_created on public.ledger_transactions(created_at desc);

create table public.ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions(id) on delete restrict,
  account_id     uuid not null references public.ledger_accounts(id) on delete restrict,
  -- Signed: debit > 0, credit < 0. Entries of one transaction must sum to zero.
  amount_minor   bigint not null check (amount_minor <> 0),
  currency       char(3) not null default 'INR',
  created_at     timestamptz not null default now()
);
create index idx_ledger_entries_tx on public.ledger_entries(transaction_id);
create index idx_ledger_entries_account on public.ledger_entries(account_id, created_at desc);

-- Append-only: corrections are new reversing transactions, never edits.
create trigger ledger_tx_append_only before update or delete on public.ledger_transactions
  for each row execute function app.forbid_mutation();
create trigger ledger_entries_append_only before update or delete on public.ledger_entries
  for each row execute function app.forbid_mutation();

-- Balanced-transaction check, deferred to commit so entries can be inserted one
-- by one inside the same transaction.
create or replace function app.assert_ledger_balanced()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sum bigint;
begin
  select coalesce(sum(amount_minor),0) into v_sum
    from public.ledger_entries where transaction_id = new.transaction_id;
  if v_sum <> 0 then
    raise exception 'Ledger transaction % is unbalanced by % minor units',
      new.transaction_id, v_sum using errcode = 'check_violation';
  end if;
  return null;
end; $$;

create constraint trigger ledger_balanced
  after insert on public.ledger_entries
  deferrable initially deferred
  for each row execute function app.assert_ledger_balanced();

create table public.payouts (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.vehicle_owners(id) on delete restrict,
  period_start   date not null,
  period_end     date not null,
  gross_minor    bigint not null check (gross_minor >= 0),
  fee_minor      bigint not null default 0 check (fee_minor >= 0),
  net_minor      bigint not null check (net_minor >= 0),
  currency       char(3) not null default 'INR',
  status         text not null default 'pending',
  status_domain  text generated always as ('payout') stored,
  provider_transfer_id text,
  approved_by    uuid references public.profiles(id) on delete set null,
  approved_at    timestamptz,
  paid_at        timestamptz,
  failure_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint fk_payouts_status foreign key (status_domain, status)
    references public.states(domain, code),
  constraint chk_payout_period check (period_end >= period_start),
  constraint chk_payout_net check (net_minor = gross_minor - fee_minor),
  unique (owner_id, period_start, period_end)
);
create index idx_payouts_owner on public.payouts(owner_id, period_start desc);
create index idx_payouts_status on public.payouts(status) where status <> 'paid';
create trigger payouts_updated_at before update on public.payouts
  for each row execute function app.set_updated_at();

alter table public.ledger_transactions
  add constraint fk_ledger_tx_payout foreign key (payout_id)
  references public.payouts(id) on delete restrict;

-- Idempotency for all money-moving API calls (PRD: idempotency requirement).
create table public.idempotency_keys (
  key            text primary key,
  user_id        uuid references public.profiles(id) on delete set null,
  endpoint       text not null,
  request_hash   text not null,
  response_body  jsonb,
  status_code    int,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '24 hours'
);
create index idx_idempotency_expiry on public.idempotency_keys(expires_at);
-- =============================================================================
--  TinyRide v3 schema — 07 · Trips, child manifests, handovers, telemetry
--
--  v2 generated the manifest from a trigger that joined every booking on the
--  route regardless of direction, service window, school holiday or absence.
--  v3 generates trips and manifests from an explicit, idempotent, re-runnable
--  function (schedulable via pg_cron / an edge function).
-- =============================================================================

set search_path = public, extensions;

create table public.trips (
  id               uuid primary key default gen_random_uuid(),
  schedule_id      uuid not null references public.route_schedules(id) on delete restrict,
  route_id         uuid not null references public.routes(id) on delete restrict,
  trip_date        date not null,
  direction        trip_direction not null,
  driver_id        uuid not null references public.drivers(id) on delete restrict,
  vehicle_id       uuid not null references public.vehicles(id) on delete restrict,
  assignment_id    uuid references public.route_assignments(id) on delete set null,
  scheduled_start  timestamptz not null,
  actual_start     timestamptz,
  actual_end       timestamptz,
  state            text not null default 'scheduled',
  state_domain     text generated always as ('trip') stored,
  readiness_checked_at timestamptz,
  cancel_reason_code text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint fk_trips_state foreign key (state_domain, state)
    references public.states(domain, code),
  constraint chk_trips_times check (actual_end is null or actual_start is null
                                    or actual_end >= actual_start),
  constraint chk_trips_started check (state not in ('in_progress','completed')
                                      or actual_start is not null),
  -- schedule_id is NOT NULL, so this really is one trip per run per day
  -- (v2's nullable schedule_id silently allowed duplicates).
  unique (schedule_id, trip_date),
  unique (id, trip_date)
);
create index idx_trips_route_date on public.trips(route_id, trip_date);
create index idx_trips_driver_date on public.trips(driver_id, trip_date);
create index idx_trips_open on public.trips(trip_date)
  where state in ('scheduled','ready','in_progress','delayed');
create trigger trips_updated_at before update on public.trips
  for each row execute function app.set_updated_at();
create trigger trips_state_machine before update on public.trips
  for each row execute function app.enforce_state_machine('trip','state');

-- Parent-reported absence, independent of any trip row existing yet.
create table public.child_absences (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children(id) on delete cascade,
  booking_id   uuid references public.bookings(id) on delete cascade,
  schedule_id  uuid references public.route_schedules(id) on delete cascade,
  absence_date date not null,
  direction    trip_direction,                 -- null = whole day
  reason       text,
  reported_by  uuid not null references public.profiles(id) on delete restrict,
  cancelled_at timestamptz,
  created_at   timestamptz not null default now()
);
create unique index uq_child_absence on public.child_absences(child_id, absence_date, coalesce(direction,'am'))
  where cancelled_at is null;
create index idx_child_absences_date on public.child_absences(absence_date);

create table public.trip_children (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references public.trips(id) on delete cascade,
  trip_date         date not null,
  child_id          uuid not null references public.children(id) on delete restrict,
  booking_id        uuid not null references public.bookings(id) on delete restrict,
  pickup_stop_id    uuid not null references public.route_stops(id) on delete restrict,
  dropoff_stop_id   uuid not null references public.route_stops(id) on delete restrict,
  sequence_no       int,
  state             text not null default 'pending',
  state_domain      text generated always as ('trip_child') stored,
  -- Required handover legs for this child on this trip, derived from direction.
  required_legs     handover_leg[] not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (trip_id, child_id),
  unique (id, trip_id),
  constraint fk_trip_children_trip foreign key (trip_id, trip_date)
    references public.trips(id, trip_date) on delete cascade,
  constraint fk_trip_children_state foreign key (state_domain, state)
    references public.states(domain, code)
);
create index idx_trip_children_trip_state on public.trip_children(trip_id, state);
create index idx_trip_children_child_date on public.trip_children(child_id, trip_date desc);
create index idx_trip_children_booking on public.trip_children(booking_id);
create trigger trip_children_updated_at before update on public.trip_children
  for each row execute function app.set_updated_at();
create trigger trip_children_state_machine before update on public.trip_children
  for each row execute function app.enforce_state_machine('trip_child','state');

-- -----------------------------------------------------------------------------
-- Handovers: the safety core. One row per completed leg, plus hashed OTPs and
-- every failed attempt (PRD: bounded retry, never GPS-only completion).
-- -----------------------------------------------------------------------------
create table public.handover_tokens (
  id             uuid primary key default gen_random_uuid(),
  trip_child_id  uuid not null references public.trip_children(id) on delete cascade,
  leg            handover_leg not null,
  -- Never store the OTP: store a salted hash. Excluded from logs and pushes.
  token_hash     bytea not null,
  token_salt     bytea not null,
  issued_to      uuid references public.profiles(id) on delete set null,
  issued_at      timestamptz not null default now(),
  expires_at     timestamptz not null,
  attempts       int not null default 0 check (attempts >= 0),
  max_attempts   int not null default 3 check (max_attempts > 0),
  consumed_at    timestamptz,
  invalidated_at timestamptz,
  constraint chk_handover_token_expiry check (expires_at > issued_at)
);
-- One live token per leg.
create unique index uq_handover_token_live on public.handover_tokens(trip_child_id, leg)
  where consumed_at is null and invalidated_at is null;
create index idx_handover_tokens_expiry on public.handover_tokens(expires_at)
  where consumed_at is null and invalidated_at is null;

create table public.handovers (
  id              uuid primary key default gen_random_uuid(),
  trip_child_id   uuid not null references public.trip_children(id) on delete cascade,
  leg             handover_leg not null,
  method          handover_method not null,
  performed_by    uuid not null references public.profiles(id) on delete restrict,
  counterparty_guardian_id uuid references public.guardians(id) on delete set null,
  counterparty_school_user uuid references public.profiles(id) on delete set null,
  token_id        uuid references public.handover_tokens(id) on delete set null,
  evidence_path   text,
  geo             geography(Point, 4326),
  geo_accuracy_m  numeric(6,1),
  occurred_at     timestamptz not null default now(),
  recorded_at     timestamptz not null default now(),
  client_event_id text,                       -- offline idempotency
  override_reason text,
  created_at      timestamptz not null default now(),
  unique (trip_child_id, leg),
  constraint chk_handover_override check (method <> 'ops_override' or override_reason is not null),
  -- A guardian confirmation must name the guardian it was released to.
  constraint chk_handover_guardian check (
    method <> 'guardian_confirm' or counterparty_guardian_id is not null
  )
);
create unique index uq_handover_client_event on public.handovers(trip_child_id, client_event_id)
  where client_event_id is not null;
create index idx_handovers_trip_child on public.handovers(trip_child_id);
create trigger handovers_append_only before update or delete on public.handovers
  for each row execute function app.forbid_mutation();

create table public.handover_attempts (
  id             uuid primary key default gen_random_uuid(),
  trip_child_id  uuid not null references public.trip_children(id) on delete cascade,
  leg            handover_leg not null,
  token_id       uuid references public.handover_tokens(id) on delete set null,
  attempted_by   uuid references public.profiles(id) on delete set null,
  outcome        text not null check (outcome in ('success','wrong_code','expired','locked_out','cancelled')),
  attempted_at   timestamptz not null default now()
);
create index idx_handover_attempts_tc on public.handover_attempts(trip_child_id, attempted_at desc);

-- Only verified, pickup-authorised guardians of that child may receive a child.
create or replace function app.validate_handover()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_child_id uuid;
begin
  select tc.child_id into v_child_id
    from public.trip_children tc where tc.id = new.trip_child_id;

  if new.counterparty_guardian_id is not null then
    if not exists (
      select 1 from public.child_guardians cg
      where cg.child_id = v_child_id
        and cg.guardian_id = new.counterparty_guardian_id
        and cg.can_pickup
        and cg.verified_at is not null
        and cg.revoked_at is null
    ) then
      raise exception 'Guardian % is not a verified pickup contact for child %',
        new.counterparty_guardian_id, v_child_id using errcode = 'check_violation';
    end if;
  end if;

  if new.leg in ('school_receipt','school_release')
     and new.counterparty_school_user is null
     and new.method <> 'ops_override' then
    raise exception 'School legs require a school staff counterparty or an ops override'
      using errcode = 'check_violation';
  end if;
  return new;
end; $$;

create trigger handovers_validate before insert on public.handovers
  for each row execute function app.validate_handover();

-- A trip may only complete when every required leg of every non-absent child
-- is resolved (PRD: unresolved handover blocks completion and raises an
-- exception).
create or replace function app.assert_trip_completable()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_open int;
begin
  if new.state = 'completed' and old.state is distinct from 'completed' then
    select count(*) into v_open
      from public.trip_children tc
      cross join lateral unnest(tc.required_legs) as rl(leg)
     where tc.trip_id = new.id
       and tc.state not in ('absent','no_show')
       and not exists (
         select 1 from public.handovers h
         where h.trip_child_id = tc.id and h.leg = rl.leg
       );
    if v_open > 0 then
      raise exception 'Cannot complete trip %: % required handover(s) unresolved', new.id, v_open
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end; $$;

create trigger trips_assert_completable before update on public.trips
  for each row execute function app.assert_trip_completable();

-- -----------------------------------------------------------------------------
-- Event streams (append-only, actor-attributed, offline-idempotent)
-- -----------------------------------------------------------------------------
create table public.trip_events (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  event_type      trip_event_type not null,
  actor_user_id   uuid references public.profiles(id) on delete set null,
  occurred_at     timestamptz not null default now(),
  recorded_at     timestamptz not null default now(),
  client_event_id text,
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create unique index uq_trip_events_client on public.trip_events(trip_id, client_event_id)
  where client_event_id is not null;
create index idx_trip_events_trip on public.trip_events(trip_id, occurred_at);
create trigger trip_events_append_only before update or delete on public.trip_events
  for each row execute function app.forbid_mutation();

create table public.trip_child_events (
  id              uuid primary key default gen_random_uuid(),
  trip_child_id   uuid not null references public.trip_children(id) on delete cascade,
  event_type      trip_child_event_type not null,
  actor_user_id   uuid references public.profiles(id) on delete set null,
  actor_role      text,
  from_state      text,
  to_state        text,
  occurred_at     timestamptz not null default now(),
  recorded_at     timestamptz not null default now(),
  client_event_id text,
  payload         jsonb not null default '{}'::jsonb
);
create unique index uq_trip_child_events_client on public.trip_child_events(trip_child_id, client_event_id)
  where client_event_id is not null;
create index idx_trip_child_events_tc on public.trip_child_events(trip_child_id, occurred_at);
create trigger trip_child_events_append_only before update or delete on public.trip_child_events
  for each row execute function app.forbid_mutation();

-- School-side confirmations are their own evidence records, separate from the
-- driver-recorded handover.
create table public.school_confirmations (
  id             uuid primary key default gen_random_uuid(),
  trip_child_id  uuid not null references public.trip_children(id) on delete cascade,
  school_id      uuid not null references public.schools(id) on delete restrict,
  confirmation   text not null check (confirmation in ('am_receipt','pm_release','mismatch')),
  confirmed_by   uuid not null references public.profiles(id) on delete restrict,
  driver_verified boolean,
  vehicle_verified boolean,
  note           text,
  confirmed_at   timestamptz not null default now(),
  unique (trip_child_id, confirmation)
);
create index idx_school_confirmations_school on public.school_confirmations(school_id, confirmed_at desc);

-- High-volume telemetry: monthly partitions + short retention. Never exposed to
-- parents as "live" location; the API serves timestamped freshness instead.
create table public.trip_locations (
  id           bigint generated always as identity,
  trip_id      uuid not null references public.trips(id) on delete cascade,
  recorded_at  timestamptz not null default now(),
  geo          geography(Point, 4326) not null,
  speed_kph    numeric(5,1),
  accuracy_m   numeric(6,1),
  primary key (id, recorded_at)
) partition by range (recorded_at);

create table public.trip_locations_default partition of public.trip_locations default;
-- Example monthly partition; create ahead of time with a scheduled job.
create table public.trip_locations_2026_01 partition of public.trip_locations
  for values from ('2026-01-01') to ('2026-02-01');
create index idx_trip_locations_trip_time on public.trip_locations(trip_id, recorded_at desc);

-- -----------------------------------------------------------------------------
-- Trip generation: idempotent, holiday-aware, absence-aware
-- -----------------------------------------------------------------------------
create or replace function app.generate_trips_for_date(p_date date)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_created int := 0;
begin
  with candidate as (
    select s.id as schedule_id, s.route_id, s.direction, s.departure_time, s.timezone,
           r.school_id,
           ra.id as assignment_id, ra.driver_id, ra.vehicle_id
      from public.route_schedules s
      join public.routes r on r.id = s.route_id
      join public.route_assignments ra
        on ra.schedule_id = s.id
       and ra.assignment_type = 'primary'
       and ra.revoked_at is null
       and ra.validity @> p_date
     where s.active
       and r.state = 'approved'
       and extract(isodow from p_date)::smallint = any (s.days_of_week)
       and not exists (
         select 1 from public.school_calendar_days cd
         where cd.school_id = r.school_id
           and cd.calendar_date = p_date
           and cd.day_type = 'holiday'
       )
  ), inserted as (
    insert into public.trips (schedule_id, route_id, trip_date, direction, driver_id,
                              vehicle_id, assignment_id, scheduled_start)
    select c.schedule_id, c.route_id, p_date, c.direction, c.driver_id, c.vehicle_id,
           c.assignment_id,
           (p_date + c.departure_time) at time zone c.timezone
      from candidate c
    on conflict (schedule_id, trip_date) do nothing
    returning 1
  )
  select count(*) into v_created from inserted;

  -- Manifest: only bookings that are live, in service window, on the right run,
  -- and whose child has not been marked absent for that date/direction.
  insert into public.trip_children (trip_id, trip_date, child_id, booking_id,
                                    pickup_stop_id, dropoff_stop_id, sequence_no, required_legs)
  select t.id, t.trip_date, b.child_id, b.id,
         b.pickup_stop_id, b.dropoff_stop_id,
         rss.sequence_no,
         case when t.direction = 'am'
              then array['home_pickup','school_receipt']::public.handover_leg[]
              else array['school_release','home_dropoff']::public.handover_leg[]
         end
    from public.trips t
    join public.bookings b
      on b.schedule_id = t.schedule_id
     and b.state in ('confirmed','active')
     and b.service_start <= t.trip_date
     and (b.service_end is null or b.service_end >= t.trip_date)
    left join public.route_schedule_stops rss
      on rss.schedule_id = t.schedule_id
     and rss.stop_id = case when t.direction = 'am' then b.pickup_stop_id else b.dropoff_stop_id end
   where t.trip_date = p_date
     and not exists (
       select 1 from public.child_absences a
       where a.child_id = b.child_id
         and a.absence_date = p_date
         and a.cancelled_at is null
         and (a.direction is null or a.direction = t.direction)
     )
  on conflict (trip_id, child_id) do nothing;

  return v_created;
end; $$;
-- =============================================================================
--  TinyRide v3 schema — 08 · Exceptions, incidents, reassignment
--
--  The PRD says "creates an exception" nine times but v2 had no exception
--  table — only incidents. They are different objects: an exception is an
--  operational work item with an SLA; an incident is a safety case with
--  evidence and an approved closure.
-- =============================================================================

set search_path = public, extensions;

create table public.severities (
  code       text primary key,
  label      text not null,
  sort_order int not null default 0,
  color      text,
  sla_minutes int not null
);
insert into public.severities (code, label, sort_order, color, sla_minutes) values
  ('low','Low',10,'#0A9C49',4320),
  ('medium','Medium',20,'#FEA707',1440),
  ('high','High',30,'#ff8c42',240),
  ('critical','Critical',40,'#f2555a',60);

create table public.exceptions (
  id             uuid primary key default gen_random_uuid(),
  exception_type exception_type not null,
  severity       text not null default 'medium' references public.severities(code),
  state          text not null default 'open',
  state_domain   text generated always as ('exception') stored,
  -- Source references (any subset may apply).
  trip_id        uuid references public.trips(id) on delete set null,
  trip_child_id  uuid references public.trip_children(id) on delete set null,
  booking_id     uuid references public.bookings(id) on delete set null,
  payment_id     uuid references public.payments(id) on delete set null,
  driver_id      uuid references public.drivers(id) on delete set null,
  school_id      uuid references public.schools(id) on delete set null,
  title          text not null,
  details        jsonb not null default '{}'::jsonb,
  raised_by      uuid references public.profiles(id) on delete set null,
  auto_raised    boolean not null default false,
  assigned_to    uuid references public.profiles(id) on delete set null,
  sla_due_at     timestamptz,
  acknowledged_at timestamptz,
  resolved_at    timestamptz,
  resolution_code text,
  resolution_note text,
  incident_id    uuid,                        -- FK added after incidents
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint fk_exceptions_state foreign key (state_domain, state)
    references public.states(domain, code),
  constraint chk_exceptions_resolution check (
    (state = 'resolved') = (resolved_at is not null)
  )
);
create index idx_exceptions_queue on public.exceptions(severity, sla_due_at)
  where state in ('open','acknowledged','in_progress');
create index idx_exceptions_assignee on public.exceptions(assigned_to)
  where state in ('open','acknowledged','in_progress');
create index idx_exceptions_trip on public.exceptions(trip_id);
create trigger exceptions_updated_at before update on public.exceptions
  for each row execute function app.set_updated_at();
create trigger exceptions_state_machine before update on public.exceptions
  for each row execute function app.enforce_state_machine('exception','state');

create or replace function app.set_exception_sla()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sla_due_at is null then
    select now() + make_interval(mins => s.sla_minutes) into new.sla_due_at
      from public.severities s where s.code = new.severity;
  end if;
  return new;
end; $$;
create trigger exceptions_sla before insert on public.exceptions
  for each row execute function app.set_exception_sla();

create table public.incidents (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique default ('INC-' || to_char(now(),'YYYYMMDD') || '-' ||
                                                    upper(substr(encode(gen_random_bytes(3),'hex'),1,6))),
  trip_id             uuid references public.trips(id) on delete set null,
  trip_child_id       uuid references public.trip_children(id) on delete set null,
  child_id            uuid references public.children(id) on delete set null,
  driver_id           uuid references public.drivers(id) on delete set null,
  school_id           uuid references public.schools(id) on delete set null,
  severity            text not null default 'medium' references public.severities(code),
  status              text not null default 'open',
  status_domain       text generated always as ('incident') stored,
  category            text,
  summary             text not null,
  description         text,
  reported_by_user_id uuid not null references public.profiles(id) on delete restrict,
  assigned_to         uuid references public.profiles(id) on delete set null,
  sla_due_at          timestamptz,
  contained_at        timestamptz,
  resolved_at         timestamptz,
  closed_at           timestamptz,
  closed_by           uuid references public.profiles(id) on delete set null,
  closure_approved_by uuid references public.profiles(id) on delete set null,
  closure_note        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint fk_incidents_status foreign key (status_domain, status)
    references public.states(domain, code),
  -- PRD: close only after required fields and approvals are complete.
  constraint chk_incident_closure check (
    status <> 'closed' or (closed_at is not null and closure_approved_by is not null
                           and closure_note is not null)
  )
);
create index idx_incidents_queue on public.incidents(status, severity, sla_due_at);
create index idx_incidents_trip on public.incidents(trip_id);
create index idx_incidents_child on public.incidents(child_id);
create trigger incidents_updated_at before update on public.incidents
  for each row execute function app.set_updated_at();
create trigger incidents_state_machine before update on public.incidents
  for each row execute function app.enforce_state_machine('incident','status');

alter table public.exceptions
  add constraint fk_exceptions_incident foreign key (incident_id)
  references public.incidents(id) on delete set null;

create table public.incident_events (
  id            uuid primary key default gen_random_uuid(),
  incident_id   uuid not null references public.incidents(id) on delete cascade,
  event_type    incident_event_type not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  from_status   text,
  to_status     text,
  note          text,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index idx_incident_events_incident on public.incident_events(incident_id, created_at);
create trigger incident_events_append_only before update or delete on public.incident_events
  for each row execute function app.forbid_mutation();

create table public.incident_evidence (
  id            uuid primary key default gen_random_uuid(),
  incident_id   uuid not null references public.incidents(id) on delete restrict,
  evidence_type text not null check (evidence_type in ('photo','video','audio','document','log','other')),
  storage_path  text not null,
  checksum_sha256 text,
  captured_at   timestamptz,
  uploaded_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index idx_incident_evidence_incident on public.incident_evidence(incident_id);
-- Evidence must be preserved: no deletes, no path rewrites.
create trigger incident_evidence_append_only before update or delete on public.incident_evidence
  for each row execute function app.forbid_mutation();

create table public.trip_reassignment_requests (
  id                  uuid primary key default gen_random_uuid(),
  trip_id             uuid not null references public.trips(id) on delete cascade,
  exception_id        uuid references public.exceptions(id) on delete set null,
  request_type        reassignment_request_type not null,
  reason              text not null,
  current_driver_id   uuid references public.drivers(id) on delete set null,
  requested_driver_id uuid references public.drivers(id) on delete set null,
  requested_vehicle_id uuid references public.vehicles(id) on delete set null,
  approved_driver_id  uuid references public.drivers(id) on delete set null,
  approved_vehicle_id uuid references public.vehicles(id) on delete set null,
  state               text not null default 'pending',
  state_domain        text generated always as ('reassignment') stored,
  requested_by        uuid not null references public.profiles(id) on delete restrict,
  decided_by          uuid references public.profiles(id) on delete set null,
  decided_at          timestamptz,
  decision_note       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint fk_trr_state foreign key (state_domain, state)
    references public.states(domain, code),
  constraint chk_trr_decision check (state in ('pending') or decided_by is not null)
);
create index idx_trr_trip on public.trip_reassignment_requests(trip_id);
create index idx_trr_pending on public.trip_reassignment_requests(created_at)
  where state = 'pending';
create trigger trr_updated_at before update on public.trip_reassignment_requests
  for each row execute function app.set_updated_at();
create trigger trr_state_machine before update on public.trip_reassignment_requests
  for each row execute function app.enforce_state_machine('reassignment','state');

-- Substitutions are never silent: an approved reassignment must name an
-- approved driver who is authorised for the vehicle.
create or replace function app.validate_reassignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.state = 'approved' then
    if new.approved_driver_id is null or new.approved_vehicle_id is null then
      raise exception 'Approved reassignment must name driver and vehicle'
        using errcode = 'check_violation';
    end if;
    if (select state from public.drivers where id = new.approved_driver_id) <> 'approved' then
      raise exception 'Substitute driver is not approved' using errcode = 'check_violation';
    end if;
    if (select state from public.vehicles where id = new.approved_vehicle_id) <> 'approved' then
      raise exception 'Substitute vehicle is not approved' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end; $$;
create trigger trr_validate before insert or update on public.trip_reassignment_requests
  for each row execute function app.validate_reassignment();
-- =============================================================================
--  TinyRide v3 schema — 09 · Notifications, support, audit spine, retention
-- =============================================================================

set search_path = public, extensions;

create table public.notification_templates (
  code          text primary key,
  notification_type notification_type not null,
  channel       notification_channel not null,
  locale        text not null default 'en-IN',
  title_template text not null,
  body_template text not null,
  active        boolean not null default true
);

create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  notification_type notification_type not null,
  title             text not null,
  body              text not null,
  -- Payload must never carry OTPs or precise location (PRD).
  data              jsonb not null default '{}'::jsonb,
  trip_id           uuid references public.trips(id) on delete set null,
  booking_id        uuid references public.bookings(id) on delete set null,
  incident_id       uuid references public.incidents(id) on delete set null,
  read_at           timestamptz,
  created_at        timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id) where read_at is null;

create table public.notification_deliveries (
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel         notification_channel not null,
  device_id       uuid references public.user_devices(id) on delete set null,
  status          text not null default 'queued'
                    check (status in ('queued','sent','delivered','failed','suppressed')),
  provider_message_id text,
  attempts        int not null default 0,
  error_code      text,
  queued_at       timestamptz not null default now(),
  sent_at         timestamptz,
  delivered_at    timestamptz,
  failed_at       timestamptz
);
create index idx_deliveries_notification on public.notification_deliveries(notification_id);
create index idx_deliveries_retry on public.notification_deliveries(queued_at)
  where status in ('queued','failed');

-- -----------------------------------------------------------------------------
-- Support (ticket-scoped access, PRD)
-- -----------------------------------------------------------------------------
create table public.support_tickets (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique default ('TKT-' || to_char(now(),'YYYYMMDD') || '-' ||
                                              upper(substr(encode(gen_random_bytes(3),'hex'),1,6))),
  requester_id  uuid not null references public.profiles(id) on delete restrict,
  category      ticket_category not null default 'other',
  subject       text not null,
  state         text not null default 'open',
  state_domain  text generated always as ('ticket') stored,
  severity      text references public.severities(code),
  assigned_to   uuid references public.profiles(id) on delete set null,
  requester_verified_at timestamptz,        -- PRD: verify requester before disclosure
  first_response_at timestamptz,
  resolved_at   timestamptz,
  closed_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint fk_tickets_state foreign key (state_domain, state)
    references public.states(domain, code)
);
create index idx_tickets_queue on public.support_tickets(state, created_at)
  where state in ('open','in_progress','waiting_on_user');
create index idx_tickets_requester on public.support_tickets(requester_id, created_at desc);
create trigger tickets_updated_at before update on public.support_tickets
  for each row execute function app.set_updated_at();
create trigger tickets_state_machine before update on public.support_tickets
  for each row execute function app.enforce_state_machine('ticket','state');

-- Explicit, revocable scope grants make "support access is ticket-scoped"
-- enforceable in RLS instead of being a code convention.
create table public.ticket_scopes (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references public.support_tickets(id) on delete cascade,
  subject_type text not null check (subject_type in ('parent','child','booking','payment','trip')),
  subject_id   uuid not null,
  granted_by   uuid references public.profiles(id) on delete set null,
  granted_at   timestamptz not null default now(),
  unique (ticket_id, subject_type, subject_id)
);
create index idx_ticket_scopes_subject on public.ticket_scopes(subject_type, subject_id);

create table public.ticket_messages (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references public.support_tickets(id) on delete cascade,
  author_id    uuid references public.profiles(id) on delete set null,
  is_internal  boolean not null default false,
  body         text not null,
  attachments  jsonb not null default '[]'::jsonb,
  -- When an AI assistant drafts a reply it is recorded as such and can never be
  -- the approver of a safety or refund decision (PRD constraint).
  ai_generated boolean not null default false,
  created_at   timestamptz not null default now()
);
create index idx_ticket_messages_ticket on public.ticket_messages(ticket_id, created_at);

-- -----------------------------------------------------------------------------
-- Audit spine (append-only, monthly partitions)
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id             bigint generated always as identity,
  occurred_at    timestamptz not null default now(),
  actor_user_id  uuid,                      -- deliberately NOT a FK: audit rows
  actor_role     text,                      -- must survive user deletion
  action         audit_action not null,
  table_name     text,
  record_id      uuid,
  reason_code    text,
  correlation_id uuid,
  ip_address     inet,
  user_agent     text,
  before_data    jsonb,
  after_data     jsonb,
  primary key (id, occurred_at)
) partition by range (occurred_at);

create table public.audit_logs_default partition of public.audit_logs default;
create table public.audit_logs_2026_01 partition of public.audit_logs
  for values from ('2026-01-01') to ('2026-02-01');
create index idx_audit_actor on public.audit_logs(actor_user_id, occurred_at desc);
create index idx_audit_record on public.audit_logs(table_name, record_id, occurred_at desc);
create trigger audit_logs_append_only before update or delete on public.audit_logs
  for each row execute function app.forbid_mutation();

-- Generic row auditor for privileged tables.
create or replace function app.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_user_id, action, table_name, record_id,
                                 before_data, after_data)
  values (
    auth.uid(),
    lower(tg_op)::public.audit_action,
    tg_table_name,
    coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return null;
end; $$;

create trigger audit_user_roles after insert or update or delete on public.user_roles
  for each row execute function app.audit_row();
create trigger audit_drivers after update on public.drivers
  for each row execute function app.audit_row();
create trigger audit_bookings after update on public.bookings
  for each row execute function app.audit_row();
create trigger audit_payouts after insert or update on public.payouts
  for each row execute function app.audit_row();
create trigger audit_child_health after insert or update or delete on public.child_health_notes
  for each row execute function app.audit_row();

-- Reason-coded, approved data exports (PRD: exports restricted and logged).
create table public.data_export_requests (
  id            uuid primary key default gen_random_uuid(),
  requested_by  uuid not null references public.profiles(id) on delete restrict,
  scope         text not null,
  filters       jsonb not null default '{}'::jsonb,
  reason_code   text not null,
  justification text not null,
  approved_by   uuid references public.profiles(id) on delete set null,
  approved_at   timestamptz,
  rejected_at   timestamptz,
  executed_at   timestamptz,
  row_count     int,
  storage_path  text,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  constraint chk_export_decision check (not (approved_at is not null and rejected_at is not null))
);
create index idx_exports_pending on public.data_export_requests(created_at)
  where approved_at is null and rejected_at is null;

-- Retention policy registry, so deletion jobs are declared, not ad hoc.
create table public.retention_policies (
  table_name     text primary key,
  retain_days    int not null check (retain_days > 0),
  strategy       text not null check (strategy in ('delete','archive','anonymize')),
  legal_basis    text,
  last_run_at    timestamptz
);
insert into public.retention_policies (table_name, retain_days, strategy, legal_basis) values
  ('trip_locations', 30, 'delete', 'Location minimisation: only operational need'),
  ('handover_tokens', 7, 'delete', 'Short-lived secrets'),
  ('notification_deliveries', 90, 'delete', 'Delivery diagnostics'),
  ('audit_logs', 2555, 'archive', 'Safety and financial accountability'),
  ('trip_child_events', 1095, 'archive', 'Child safety evidence chain');
-- =============================================================================
--  TinyRide v3 schema — 10 · Row Level Security
--
--  v2 shipped zero RLS. On Supabase every table in `public` is reachable through
--  PostgREST with the caller's JWT, so "server-side authorization" only exists
--  if RLS exists. Default posture here: deny everything, then grant narrow,
--  role-aware read paths. Writes on safety/finance objects go through
--  SECURITY DEFINER functions, not direct table grants.
-- =============================================================================

-- Default-deny on every application table.
set search_path = public, extensions;

do $$
declare t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('alter table public.%I force row level security', t.tablename);
  end loop;
end $$;

-- Helper functions live in `app`, which is not exposed to PostgREST.
revoke all on schema app from public, anon, authenticated;
grant usage on schema app to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Reference data: readable by any authenticated user (labels, colours, states)
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['states','state_domains','state_transitions','severities',
                           'roles','cities','zones','policy_documents','notification_templates']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_read', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Profiles & roles
-- -----------------------------------------------------------------------------
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or app.is_staff());

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and state = 'active');

create policy user_roles_self_read on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or app.is_admin());
-- Role grants are written only by SECURITY DEFINER admin functions.

create policy consents_self on public.consents
  for select to authenticated using (user_id = auth.uid() or app.is_admin());
create policy consents_insert_self on public.consents
  for insert to authenticated with check (user_id = auth.uid());

create policy devices_self on public.user_devices
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Family: parents see only their own family; support only via ticket scope
-- -----------------------------------------------------------------------------
create policy parents_self on public.parents
  for select to authenticated
  using (user_id = auth.uid() or app.is_staff() or app.has_ticket_grant('parent', id));

create policy children_parent on public.children
  for all to authenticated
  using (
    app.owns_child(id)
    or app.is_staff()
    or app.has_ticket_grant('child', id)
    -- School staff see only their own school's children.
    or app.is_school_member(school_id)
  )
  with check (app.owns_child(id) or app.is_staff());

-- Drivers never read the children table directly; they read the day's manifest
-- view, which exposes first name, stop and handover state only.

create policy child_health_read on public.child_health_notes
  for select to authenticated
  using (app.owns_child(child_id) or app.has_role('kyc_reviewer') or app.is_admin());
create policy child_health_write on public.child_health_notes
  for all to authenticated
  using (app.owns_child(child_id)) with check (app.owns_child(child_id));

create policy guardians_parent on public.guardians
  for all to authenticated
  using (parent_id = app.current_parent_id() or app.is_staff())
  with check (parent_id = app.current_parent_id());

create policy child_guardians_parent on public.child_guardians
  for all to authenticated
  using (app.owns_child(child_id) or app.is_staff())
  with check (app.owns_child(child_id));

create policy family_locations_parent on public.family_locations
  for all to authenticated
  using (parent_id = app.current_parent_id() or app.is_staff())
  with check (parent_id = app.current_parent_id());

-- -----------------------------------------------------------------------------
-- Schools: tenant isolation
-- -----------------------------------------------------------------------------
create policy schools_read on public.schools
  for select to authenticated
  using (
    status = 'active' and verification_status = 'verified'   -- discoverable
    or app.is_school_member(id) or app.is_staff()
  );

create policy school_users_read on public.school_users
  for select to authenticated
  using (user_id = auth.uid() or app.is_school_member(school_id) or app.is_staff());

create policy school_calendar_read on public.school_calendar_days
  for select to authenticated
  using (app.is_school_member(school_id) or app.is_staff()
         or exists (select 1 from public.children c
                    where c.school_id = school_calendar_days.school_id and app.owns_child(c.id)));

-- -----------------------------------------------------------------------------
-- Supply
-- -----------------------------------------------------------------------------
create policy drivers_self on public.drivers
  for select to authenticated
  using (user_id = auth.uid() or app.is_staff()
         or exists (select 1 from public.route_assignments ra
                    join public.route_schedules rs on rs.id = ra.schedule_id
                    join public.routes r on r.id = rs.route_id
                    where ra.driver_id = drivers.id and app.is_school_member(r.school_id)));

create policy vehicles_owner on public.vehicles
  for select to authenticated
  using (owner_id = app.current_owner_id() or app.is_staff()
         or exists (select 1 from public.driver_vehicle_assignments dva
                    where dva.vehicle_id = vehicles.id
                      and dva.driver_id = app.current_driver_id()
                      and dva.revoked_at is null));

create policy vehicle_owners_self on public.vehicle_owners
  for select to authenticated
  using (user_id = auth.uid() or app.is_staff());

-- Documents are never client-readable: they are fetched through signed URLs
-- issued by an edge function after an authorization check.
create policy documents_reviewer on public.documents
  for select to authenticated
  using (app.has_role('kyc_reviewer') or app.is_admin());
create policy documents_upload_own on public.documents
  for insert to authenticated
  with check (
    (driver_id is not null and driver_id = app.current_driver_id())
    or (vehicle_id is not null and exists (
          select 1 from public.vehicles v
          where v.id = vehicle_id and v.owner_id = app.current_owner_id()))
    or (owner_id is not null and owner_id = app.current_owner_id())
  );

create policy verification_reviews_read on public.verification_reviews
  for select to authenticated
  using (
    app.is_staff()
    or driver_id = app.current_driver_id()
    or exists (select 1 from public.vehicles v
               where v.id = verification_reviews.vehicle_id and v.owner_id = app.current_owner_id())
  );

-- -----------------------------------------------------------------------------
-- Routes: only approved routes are discoverable by parents
-- -----------------------------------------------------------------------------
create policy routes_discovery on public.routes
  for select to authenticated
  using (
    state = 'approved'
    or proposed_by = auth.uid()
    or owner_id = app.current_owner_id()
    or app.is_staff()
  );

create policy route_schedules_read on public.route_schedules
  for select to authenticated
  using (exists (select 1 from public.routes r
                 where r.id = route_schedules.route_id
                   and (r.state = 'approved' or r.proposed_by = auth.uid() or app.is_staff())));

create policy route_stops_read on public.route_stops
  for select to authenticated
  using (exists (select 1 from public.routes r
                 where r.id = route_stops.route_id
                   and (r.state = 'approved' or r.proposed_by = auth.uid() or app.is_staff())));

create policy route_prices_read on public.route_prices
  for select to authenticated using (true);

create policy route_assignments_read on public.route_assignments
  for select to authenticated
  using (driver_id = app.current_driver_id() or app.is_staff()
         or exists (select 1 from public.vehicles v
                    where v.id = route_assignments.vehicle_id and v.owner_id = app.current_owner_id()));

-- -----------------------------------------------------------------------------
-- Booking & money: parent-owned, finance-visible, never driver-visible
-- -----------------------------------------------------------------------------
create policy bookings_parent on public.bookings
  for select to authenticated
  using (parent_id = app.current_parent_id() or app.is_staff()
         or app.has_ticket_grant('booking', id));
-- Booking writes go exclusively through app.reserve_seat / confirm functions.

create policy seat_holds_parent on public.seat_holds
  for select to authenticated
  using (parent_id = app.current_parent_id() or app.is_staff());

create policy subscriptions_parent on public.subscriptions
  for select to authenticated
  using (exists (select 1 from public.bookings b
                 where b.id = subscriptions.booking_id and b.parent_id = app.current_parent_id())
         or app.has_role('finance_admin') or app.is_admin());

create policy payments_parent on public.payments
  for select to authenticated
  using (parent_id = app.current_parent_id()
         or app.has_role('finance_admin') or app.is_admin()
         or app.has_ticket_grant('payment', id));

create policy payouts_owner on public.payouts
  for select to authenticated
  using (owner_id = app.current_owner_id() or app.has_role('finance_admin') or app.is_admin());

create policy ledger_finance_only on public.ledger_entries
  for select to authenticated using (app.has_role('finance_admin') or app.is_admin());
create policy ledger_tx_finance_only on public.ledger_transactions
  for select to authenticated using (app.has_role('finance_admin') or app.is_admin());
-- payment_webhooks, idempotency_keys, ledger_accounts: service_role only (no policy).

-- -----------------------------------------------------------------------------
-- Trips: driver sees own current-day trips, parent sees trips their child is on
-- -----------------------------------------------------------------------------
create policy trips_driver on public.trips
  for select to authenticated
  using (
    app.drives_trip(id)
    or app.is_staff()
    or exists (select 1 from public.trip_children tc
               where tc.trip_id = trips.id and app.owns_child(tc.child_id))
    or exists (select 1 from public.routes r
               where r.id = trips.route_id and app.is_school_member(r.school_id))
  );

create policy trip_children_scoped on public.trip_children
  for select to authenticated
  using (
    app.owns_child(child_id)
    or app.drives_trip(trip_id)
    or app.is_staff()
    or exists (select 1 from public.children c
               where c.id = trip_children.child_id and app.is_school_member(c.school_id))
  );

create policy trip_events_scoped on public.trip_events
  for select to authenticated
  using (app.drives_trip(trip_id) or app.is_staff()
         or exists (select 1 from public.trip_children tc
                    where tc.trip_id = trip_events.trip_id and app.owns_child(tc.child_id)));

create policy trip_child_events_scoped on public.trip_child_events
  for select to authenticated
  using (exists (select 1 from public.trip_children tc
                 where tc.id = trip_child_events.trip_child_id
                   and (app.owns_child(tc.child_id) or app.drives_trip(tc.trip_id)))
         or app.is_staff());

create policy handovers_scoped on public.handovers
  for select to authenticated
  using (exists (select 1 from public.trip_children tc
                 where tc.id = handovers.trip_child_id
                   and (app.owns_child(tc.child_id) or app.drives_trip(tc.trip_id)))
         or app.is_staff());

-- Raw OTP material and telemetry are service-role only: no policies at all.
-- (handover_tokens, trip_locations, audit_logs, data_export_requests)

create policy absences_parent on public.child_absences
  for all to authenticated
  using (app.owns_child(child_id) or app.is_staff())
  with check (app.owns_child(child_id) or app.is_staff());

create policy school_confirmations_scoped on public.school_confirmations
  for all to authenticated
  using (app.is_school_member(school_id) or app.is_staff())
  with check (app.is_school_member(school_id));

-- -----------------------------------------------------------------------------
-- Ops, safety, support, notifications
-- -----------------------------------------------------------------------------
create policy exceptions_staff on public.exceptions
  for all to authenticated using (app.is_staff()) with check (app.is_staff());

create policy incidents_read on public.incidents
  for select to authenticated
  using (app.is_staff() or reported_by_user_id = auth.uid()
         or (child_id is not null and app.owns_child(child_id)));
create policy incidents_report on public.incidents
  for insert to authenticated with check (reported_by_user_id = auth.uid());

create policy incident_events_staff on public.incident_events
  for select to authenticated using (app.is_staff());
create policy incident_evidence_staff on public.incident_evidence
  for select to authenticated using (app.is_staff());

create policy reassignment_scoped on public.trip_reassignment_requests
  for select to authenticated
  using (app.is_staff() or requested_by = auth.uid()
         or current_driver_id = app.current_driver_id());

create policy notifications_self on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_mark_read on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy tickets_requester on public.support_tickets
  for select to authenticated
  using (requester_id = auth.uid() or assigned_to = auth.uid() or app.is_admin());
create policy tickets_create on public.support_tickets
  for insert to authenticated with check (requester_id = auth.uid());

create policy ticket_messages_scoped on public.ticket_messages
  for select to authenticated
  using (exists (select 1 from public.support_tickets t
                 where t.id = ticket_messages.ticket_id
                   and (t.requester_id = auth.uid() or t.assigned_to = auth.uid() or app.is_admin()))
         and (not is_internal or app.is_staff()));

-- -----------------------------------------------------------------------------
-- Driver manifest view: the minimum-data surface the PRD asks for
-- -----------------------------------------------------------------------------
create view public.driver_trip_manifest
with (security_invoker = true) as
select tc.id            as trip_child_id,
       tc.trip_id,
       t.trip_date,
       t.direction,
       tc.sequence_no,
       c.first_name,
       left(coalesce(c.last_name,''), 1) as last_initial,
       tc.state,
       tc.required_legs,
       ps.name          as pickup_stop,
       ds.name          as dropoff_stop,
       (select count(*) from public.child_guardians cg
         where cg.child_id = c.id and cg.is_emergency_contact and cg.revoked_at is null)
                        as emergency_contact_count
  from public.trip_children tc
  join public.trips t   on t.id = tc.trip_id
  join public.children c on c.id = tc.child_id
  join public.route_stops ps on ps.id = tc.pickup_stop_id
  join public.route_stops ds on ds.id = tc.dropoff_stop_id;

grant select on public.driver_trip_manifest to authenticated;

-- -----------------------------------------------------------------------------
-- Privileges
--
--  RLS filters rows; GRANT decides whether the role reaches the table at all.
--  Supabase's default "grant all on public to anon, authenticated" is too wide
--  for this data, so we revoke it and hand back only what the policies above
--  are written for. `anon` keeps nothing: every read here is identity-scoped.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select on all tables in schema public to authenticated;

-- Writes the client is allowed to perform directly; everything else (payments,
-- ledger, trips, handovers, incidents, approvals) goes through SECURITY DEFINER
-- RPCs so the server owns the invariant.
grant insert, update on public.profiles, public.user_devices, public.consents,
  public.parents, public.children, public.child_health_notes, public.guardians,
  public.child_guardians, public.family_locations, public.child_absences,
  public.support_tickets, public.ticket_messages to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Columns that must never be client-writable even on client-writable tables.
revoke update (id, state, suspended_reason, deleted_at) on public.profiles from authenticated;
revoke update (id, parent_id, school_id) on public.children from authenticated;
revoke update (id, child_id, guardian_id, verified_at, verified_by, revoked_at)
  on public.child_guardians from authenticated;

grant usage on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema app to service_role;

-- Client-callable RPCs (each re-checks authorization internally).
grant execute on function app.reserve_seat(uuid, uuid, int) to authenticated;
