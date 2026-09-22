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
