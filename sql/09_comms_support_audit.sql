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
