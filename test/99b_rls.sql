-- RLS behaviour tests. Runs after 99_smoke.sql against its seeded data.
-- Uses the Supabase convention: role `authenticated` + request.jwt.claim.sub.
-- Each persona runs inside its own transaction so `set local` actually applies.
select (select user_id::text from public.parents limit 1) as pu,
       (select user_id::text from public.drivers limit 1) as du \gset

-- Parent session ---------------------------------------------------------------
begin;
select set_config('request.jwt.claim.sub', :'pu', true);
set local role authenticated;

do $$
declare n int;
begin
  select count(*) into n from public.children;
  if n <> 3 then raise exception 'FAIL: parent sees % children, expected 3', n; end if;

  select count(*) into n from public.trip_children;
  if n <> 1 then raise exception 'FAIL: parent sees % manifest rows, expected 1', n; end if;

  select count(*) into n from public.ledger_entries;
  if n <> 0 then raise exception 'FAIL: parent can read % ledger entries', n; end if;

  select count(*) into n from public.documents;
  if n <> 0 then raise exception 'FAIL: parent can read driver documents'; end if;
  raise notice 'PASS: parent scoped to own family, no finance/compliance leakage';
end $$;

do $$
begin
  begin
    insert into public.user_roles (user_id, role_id, granted_by)
      values (auth.uid(), (select id from public.roles where code = 'super_admin'), auth.uid());
    raise exception 'FAIL: parent granted themselves super_admin';
  exception when insufficient_privilege then
    raise notice 'PASS: self role escalation blocked';
  end;
end $$;
commit;

-- Driver session ---------------------------------------------------------------
begin;
select set_config('request.jwt.claim.sub', :'du', true);
set local role authenticated;

do $$
declare n int;
begin
  select count(*) into n from public.children;
  if n <> 0 then raise exception 'FAIL: driver reads % child records directly', n; end if;

  select count(*) into n from public.driver_trip_manifest;
  if n <> 1 then raise exception 'FAIL: driver manifest returned % rows, expected 1', n; end if;

  begin
    select count(*) into n from public.handover_tokens;
    if n <> 0 then raise exception 'FAIL: driver can read handover tokens'; end if;
  exception when insufficient_privilege then
    null; -- no grant at all is the stronger outcome
  end;
  raise notice 'PASS: driver limited to assigned manifest, no OTP material';
end $$;
commit;

-- Anonymous session -------------------------------------------------------------
begin;
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from public.children;
  raise exception 'FAIL: anon read children (% rows)', n;
exception when insufficient_privilege then
  raise notice 'PASS: anon has no table privileges';
end $$;
commit;
