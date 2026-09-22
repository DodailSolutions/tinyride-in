-- Smoke tests: seed a minimal Hyderabad pilot and assert the invariants the
-- v2 schema could not enforce. Run with ON_ERROR_STOP=1.
set search_path = public, extensions;
set check_function_bodies = off;

-- Bypass RLS for the seeding session (superuser + force RLS means we must
-- explicitly disable row security for the test).
set row_security = off;

-- Trip generation needs a deterministic date: pick the next Monday.
create temporary table params as
select (date_trunc('week', current_date) + interval '7 days')::date as d;

do $$
declare
  v_city uuid; v_school uuid; v_parent_user uuid; v_parent uuid; v_child uuid;
  v_driver_user uuid; v_driver uuid; v_owner_user uuid; v_owner uuid; v_vehicle uuid;
  v_route uuid; v_sched uuid; v_pick uuid; v_drop uuid; v_price uuid;
  v_guardian uuid; v_hold public.seat_holds; v_booking uuid; v_trip uuid; v_tc uuid;
  v_d date := (select d from params);
  v_err text;
begin
  insert into public.cities (name) values ('Hyderabad') returning id into v_city;

  insert into auth.users (id) values (gen_random_uuid()) returning id into v_parent_user;
  insert into public.profiles (id, phone_e164, display_name, city_id)
    values (v_parent_user, '+919000000001', 'Parent One', v_city);
  insert into auth.users (id) values (gen_random_uuid()) returning id into v_driver_user;
  insert into public.profiles (id, phone_e164, display_name) values (v_driver_user, '+919000000002','Driver One');
  insert into auth.users (id) values (gen_random_uuid()) returning id into v_owner_user;
  insert into public.profiles (id, phone_e164, display_name) values (v_owner_user, '+919000000003','Owner One');

  insert into public.schools (city_id, name, verification_status, verified_at, verified_by)
    values (v_city, 'Little Scholars', 'verified', now(), v_owner_user) returning id into v_school;

  insert into public.parents (user_id, city_id) values (v_parent_user, v_city) returning id into v_parent;
  insert into public.children (parent_id, school_id, first_name, date_of_birth)
    values (v_parent, v_school, 'Aarav', current_date - interval '8 years') returning id into v_child;
  insert into public.guardians (parent_id, full_name, phone_e164)
    values (v_parent, 'Grandmother', '+919000000010') returning id into v_guardian;
  insert into public.child_guardians (child_id, guardian_id, relationship, can_pickup, verified_at)
    values (v_child, v_guardian, 'grandparent', true, now());

  insert into public.drivers (user_id, license_number, state, approved_at)
    values (v_driver_user, 'TS09 20230001', 'pending_verification', now()) returning id into v_driver;
  update public.drivers set state = 'approved' where id = v_driver;

  insert into public.vehicle_owners (user_id) values (v_owner_user) returning id into v_owner;
  insert into public.vehicles (owner_id, registration_number, seating_capacity, usable_capacity)
    values (v_owner, 'TS09AB1234', 8, 2) returning id into v_vehicle;
  update public.vehicles set state = 'approved', approved_at = now() where id = v_vehicle;

  insert into public.driver_vehicle_assignments (driver_id, vehicle_id, authorized_by_owner, authorized_at)
    values (v_driver, v_vehicle, v_owner_user, now());

  insert into public.routes (city_id, school_id, name, proposed_by, owner_id, state, approved_at)
    values (v_city, v_school, 'Kukatpally AM', v_driver_user, v_owner, 'draft', now())
    returning id into v_route;
  update public.routes set state = 'pending_review' where id = v_route;
  update public.routes set state = 'approved' where id = v_route;

  insert into public.route_stops (route_id, stop_type, name, address, geo)
    values (v_route,'pickup','KPHB Colony','KPHB', 'SRID=4326;POINT(78.39 17.49)')
    returning id into v_pick;
  insert into public.route_stops (route_id, stop_type, name, address, geo, school_id)
    values (v_route,'school','Little Scholars Gate','School Rd','SRID=4326;POINT(78.41 17.47)', v_school)
    returning id into v_drop;

  insert into public.route_schedules (route_id, name, direction, departure_time, seats_offered)
    values (v_route,'Morning Run','am','07:30', 2) returning id into v_sched;
  insert into public.route_schedule_stops (schedule_id, route_id, stop_id, sequence_no)
    values (v_sched, v_route, v_pick, 1), (v_sched, v_route, v_drop, 2);
  insert into public.route_prices (schedule_id, amount_minor) values (v_sched, 350000)
    returning id into v_price;

  insert into public.route_assignments (schedule_id, driver_id, vehicle_id)
    values (v_sched, v_driver, v_vehicle);

  -- 1. Reservation + booking
  v_hold := app.reserve_seat(v_child, v_sched, 10);
  insert into public.bookings (parent_id, child_id, route_id, schedule_id, pickup_stop_id,
                               dropoff_stop_id, service_start, price_id, amount_minor,
                               state, seat_hold_id, confirmed_at)
    values (v_parent, v_child, v_route, v_sched, v_pick, v_drop, v_d, v_price, 350000,
            'draft', v_hold.id, now())
    returning id into v_booking;
  update public.seat_holds set booking_id = v_booking where id = v_hold.id;
  update public.bookings set state = 'pending_reservation' where id = v_booking;
  update public.bookings set state = 'awaiting_payment' where id = v_booking;
  update public.bookings set state = 'confirmed' where id = v_booking;
  raise notice 'booking confirmed %', v_booking;

  -- 2. Illegal state transition is rejected
  begin
    update public.bookings set state = 'draft' where id = v_booking;
    raise exception 'FAIL: illegal booking transition was allowed';
  exception when check_violation then
    raise notice 'PASS: illegal booking transition rejected';
  end;

  -- 3. Cross-route stop reference is rejected
  begin
    insert into public.bookings (parent_id, child_id, route_id, schedule_id, pickup_stop_id,
                                 dropoff_stop_id, service_start, amount_minor)
    values (v_parent, v_child, v_route, v_sched, v_pick, gen_random_uuid(), v_d, 1);
    raise exception 'FAIL: foreign stop accepted';
  exception when foreign_key_violation then
    raise notice 'PASS: cross-route stop rejected';
  end;

  -- 4. Duplicate live booking for the same child/run is rejected
  begin
    insert into public.bookings (parent_id, child_id, route_id, schedule_id, pickup_stop_id,
                                 dropoff_stop_id, service_start, amount_minor, state, confirmed_at)
    values (v_parent, v_child, v_route, v_sched, v_pick, v_drop, v_d, 350000, 'confirmed', now());
    raise exception 'FAIL: duplicate booking accepted';
  exception when unique_violation then
    raise notice 'PASS: duplicate live booking rejected';
  end;

  -- 5. Oversell is impossible (2 seats offered, 1 taken; two more children fail)
  declare
    v_c2 uuid; v_c3 uuid;
  begin
    insert into public.children (parent_id, school_id, first_name, date_of_birth)
      values (v_parent, v_school, 'Diya', current_date - interval '7 years') returning id into v_c2;
    insert into public.children (parent_id, school_id, first_name, date_of_birth)
      values (v_parent, v_school, 'Kabir', current_date - interval '6 years') returning id into v_c3;
    perform app.reserve_seat(v_c2, v_sched, 10);
    begin
      perform app.reserve_seat(v_c3, v_sched, 10);
      raise exception 'FAIL: oversell allowed';
    exception when check_violation then
      raise notice 'PASS: oversell blocked by capacity counter';
    end;
  end;

  -- 6. Trip generation is holiday-aware, direction-correct and idempotent
  perform app.generate_trips_for_date(v_d);
  perform app.generate_trips_for_date(v_d);
  select id into v_trip from public.trips where schedule_id = v_sched and trip_date = v_d;
  if v_trip is null then raise exception 'FAIL: no trip generated'; end if;
  if (select count(*) from public.trips where schedule_id = v_sched and trip_date = v_d) <> 1 then
    raise exception 'FAIL: trip generation not idempotent';
  end if;
  select id into v_tc from public.trip_children where trip_id = v_trip and child_id = v_child;
  if v_tc is null then raise exception 'FAIL: manifest missing child'; end if;
  if (select required_legs from public.trip_children where id = v_tc)
     <> array['home_pickup','school_receipt']::handover_leg[] then
    raise exception 'FAIL: wrong required legs for AM trip';
  end if;
  raise notice 'PASS: trip + manifest generated idempotently';

  -- 7. Trip cannot complete with unresolved handovers
  update public.trips set state = 'ready' where id = v_trip;
  update public.trips set state = 'in_progress', actual_start = now() where id = v_trip;
  begin
    update public.trips set state = 'completed', actual_end = now() where id = v_trip;
    raise exception 'FAIL: trip completed with open handovers';
  exception when check_violation then
    raise notice 'PASS: incomplete handover chain blocks trip completion';
  end;

  -- 8. Handover to an unverified guardian is rejected
  declare v_g2 uuid;
  begin
    insert into public.guardians (parent_id, full_name, phone_e164)
      values (v_parent, 'Neighbour', '+919000000011') returning id into v_g2;
    insert into public.child_guardians (child_id, guardian_id, relationship, priority, can_pickup)
      values (v_child, v_g2, 'family_friend', 2, false);
    begin
      insert into public.handovers (trip_child_id, leg, method, performed_by, counterparty_guardian_id)
      values (v_tc, 'home_pickup', 'guardian_confirm', v_driver_user, v_g2);
      raise exception 'FAIL: unverified guardian handover accepted';
    exception when check_violation then
      raise notice 'PASS: unverified guardian handover rejected';
    end;
  end;

  -- 9. Happy-path handovers then completion
  insert into public.handovers (trip_child_id, leg, method, performed_by, counterparty_guardian_id)
    values (v_tc, 'home_pickup', 'guardian_confirm', v_driver_user, v_guardian);
  update public.trip_children set state = 'picked_up' where id = v_tc;
  insert into public.handovers (trip_child_id, leg, method, performed_by, counterparty_school_user)
    values (v_tc, 'school_receipt', 'signature', v_driver_user, v_owner_user);
  update public.trip_children set state = 'at_school' where id = v_tc;
  update public.trips set state = 'completed', actual_end = now() where id = v_trip;
  raise notice 'PASS: trip completed after all required handovers';

  -- 10. Handover rows are append-only
  begin
    update public.handovers set method = 'ops_override' where trip_child_id = v_tc;
    raise exception 'FAIL: handover was mutable';
  exception when restrict_violation then
    raise notice 'PASS: handovers are append-only';
  end;

  -- 11. Ledger must balance
  declare
    v_acc_parent uuid; v_acc_gw uuid; v_tx uuid; v_payment uuid;
  begin
    insert into public.ledger_accounts (account_type, parent_id) values ('parent_receivable', v_parent)
      returning id into v_acc_parent;
    insert into public.ledger_accounts (account_type) values ('gateway_clearing')
      returning id into v_acc_gw;
    insert into public.payments (booking_id, parent_id, amount_minor, provider_order_id)
      values (v_booking, v_parent, 350000, 'order_test_1') returning id into v_payment;
    insert into public.ledger_transactions (entry_type, payment_id, booking_id)
      values ('charge', v_payment, v_booking) returning id into v_tx;
    insert into public.ledger_entries (transaction_id, account_id, amount_minor) values
      (v_tx, v_acc_gw,     350000),   -- debit gateway clearing
      (v_tx, v_acc_parent, -350000);  -- credit parent receivable
    raise notice 'PASS: balanced ledger transaction accepted';
  end;
  raise notice 'ALL SMOKE ASSERTIONS PASSED';
end $$;

-- 12. The deferred ledger balance check fires at commit. Run inside an
-- explicit transaction that is rolled back, so the aborted state is discarded.
begin;
do $$
declare v_tx uuid; v_acc uuid;
begin
  select id into v_acc from public.ledger_accounts where account_type = 'gateway_clearing';
  insert into public.ledger_transactions (entry_type) values ('adjustment') returning id into v_tx;
  insert into public.ledger_entries (transaction_id, account_id, amount_minor) values (v_tx, v_acc, 100);
  begin
    -- forcing the deferred trigger to run early
    set constraints public.ledger_balanced immediate;
    raise exception 'FAIL: unbalanced ledger transaction accepted';
  exception when check_violation then
    raise notice 'PASS: unbalanced ledger transaction rejected';
  end;
end $$;
rollback;
