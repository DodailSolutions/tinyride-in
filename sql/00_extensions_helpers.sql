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
