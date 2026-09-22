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
