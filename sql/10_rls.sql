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
