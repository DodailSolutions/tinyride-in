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
