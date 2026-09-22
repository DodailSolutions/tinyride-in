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
