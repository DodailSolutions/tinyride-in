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
