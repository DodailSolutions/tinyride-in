-- =============================================================================
-- TinyRide v3 — 11 · Initial Production & Pilot Seed (Hyderabad)
-- Run this AFTER 00..10 or after running supabase_full_schema.sql
-- =============================================================================

set search_path = public, extensions;

-- 1. Pilot City: Hyderabad
insert into public.cities (id, name, timezone, currency, active)
values ('10000000-0000-0000-0000-000000000001', 'Hyderabad', 'Asia/Kolkata', 'INR', true)
on conflict (name) do update
set active = true, timezone = 'Asia/Kolkata', currency = 'INR';

-- 2. Operational Zones in Hyderabad
insert into public.zones (city_id, name, active)
values
  ('10000000-0000-0000-0000-000000000001', 'Hitec City', true),
  ('10000000-0000-0000-0000-000000000001', 'Gachibowli', true),
  ('10000000-0000-0000-0000-000000000001', 'Kondapur', true),
  ('10000000-0000-0000-0000-000000000001', 'Madhapur', true),
  ('10000000-0000-0000-0000-000000000001', 'Jubilee Hills', true),
  ('10000000-0000-0000-0000-000000000001', 'Banjara Hills', true),
  ('10000000-0000-0000-0000-000000000001', 'Kukatpally', true)
on conflict (city_id, name) do nothing;

-- 3. Key Partner Schools in Hyderabad (Geocoded WGS84)
insert into public.schools (
  id,
  city_id,
  name,
  address,
  geo,
  contact_phone_e164,
  status,
  verification_status,
  verified_at,
  am_arrive_by,
  pm_release_at,
  timezone
) values
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Oakridge International School, Gachibowli',
  'Khajaguda, Nanakramguda Road, Cyberabad, Hyderabad, Telangana 500008',
  st_setsrid(st_makepoint(78.3619, 17.4143), 4326),
  '+914068156666',
  'active',
  'verified',
  now(),
  '08:15:00',
  '15:30:00',
  'Asia/Kolkata'
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Olive Mount Global School, Hitec City',
  'Road No. 2, Hitec City, Madhapur, Hyderabad, Telangana 500081',
  st_setsrid(st_makepoint(78.3826, 17.4474), 4326),
  '+919876543210',
  'active',
  'verified',
  now(),
  '08:30:00',
  '15:45:00',
  'Asia/Kolkata'
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'Chirec International School, Kondapur',
  'Plot No. 1-55/12, Botanical Garden Rd, Kondapur, Hyderabad, Telangana 500084',
  st_setsrid(st_makepoint(78.3582, 17.4647), 4326),
  '+914044760999',
  'active',
  'verified',
  now(),
  '08:20:00',
  '15:30:00',
  'Asia/Kolkata'
),
(
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  'Delhi Public School (DPS), Hyderabad',
  'Survey No 74, Khajaguda Village, Gachibowli, Hyderabad, Telangana 500008',
  st_setsrid(st_makepoint(78.3752, 17.4198), 4326),
  '+914029806765',
  'active',
  'verified',
  now(),
  '08:00:00',
  '14:45:00',
  'Asia/Kolkata'
),
(
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  'Little Scholars Academy, Jubilee Hills',
  'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
  st_setsrid(st_makepoint(78.4080, 17.4320), 4326),
  '+914023547890',
  'active',
  'verified',
  now(),
  '08:30:00',
  '15:15:00',
  'Asia/Kolkata'
)
on conflict (id) do update
set name = excluded.name,
    address = excluded.address,
    geo = excluded.geo,
    status = 'active',
    verification_status = 'verified';

-- 4. Enable Supabase Realtime CDC on Telemetry & Operations Tables
do $$
begin
  -- Ensure publication exists
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  -- Add live tables to publication
  begin alter publication supabase_realtime add table public.trips; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.trip_locations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.exceptions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;

-- 5. Helper procedure: Grant Administrator Role to an Auth User
create or replace function public.grant_admin_role(p_email text)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_role_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email);
  if v_user_id is null then
    return 'Error: No user found with email ' || p_email;
  end if;

  select id into v_role_id from public.roles where code = 'admin';
  if v_role_id is null then
    return 'Error: admin role not found in public.roles';
  end if;

  -- Ensure profile exists
  insert into public.profiles (id, email, state)
  values (v_user_id, lower(p_email), 'active')
  on conflict (id) do update set email = lower(p_email), state = 'active';

  -- Grant role
  insert into public.user_roles (user_id, role_id)
  values (v_user_id, v_role_id)
  on conflict do nothing;

  return 'Success: Granted Administrator role to ' || p_email;
end;
$$;
