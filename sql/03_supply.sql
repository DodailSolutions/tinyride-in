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
