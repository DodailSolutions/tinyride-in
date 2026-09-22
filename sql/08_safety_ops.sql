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
