begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into public.users (id, first_name, email, role)
values
  ('00000000-0000-4000-8000-000000000011', 'Client Owner', 'client-owner@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000012', 'Other Owner', 'client-other@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000013', 'Client Admin', 'client-admin@example.com', 'admin');

insert into public.projects (
  id,
  owner_id,
  name,
  address,
  google_place_id,
  latitude,
  longitude
)
values
  (
    '10000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000011',
    'Owner Client Project',
    '11 Client Street',
    'client-owner-place',
    -34.60,
    -58.38
  ),
  (
    '10000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000012',
    'Other Client Project',
    '12 Client Street',
    'client-other-place',
    -34.61,
    -58.39
  );

insert into public.clients (
  id,
  owner_id,
  first_name
)
values (
  '20000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000012',
  'Other Client'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    insert into public.clients (
      id,
      owner_id,
      first_name,
      last_name,
      phone_number,
      email
    )
    values (
      '20000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000011',
      'Ada',
      'Lovelace',
      '+54 11 5555 0101',
      'ada@example.com'
    )
  $$,
  'owner can create own client'
);

select throws_ok(
  $$
    insert into public.clients (owner_id, first_name)
    values ('00000000-0000-4000-8000-000000000012', 'Not Mine')
  $$,
  '42501',
  null,
  'owner cannot create a client for another user'
);

select is(
  (
    select count(*)::integer
    from public.clients
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  1,
  'owner can read own active client'
);

select lives_ok(
  $$
    update public.projects
    set client_id = '20000000-0000-4000-8000-000000000011'
    where id = '10000000-0000-4000-8000-000000000011'
  $$,
  'owner can link own client to own project'
);

select throws_ok(
  $$
    update public.projects
    set client_id = '20000000-0000-4000-8000-000000000012'
    where id = '10000000-0000-4000-8000-000000000011'
  $$,
  '23503',
  'Project client is unavailable.',
  'cross-owner project client links are rejected'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);

select is(
  (
    select count(*)::integer
    from public.clients
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  0,
  'normal users cannot read another owners client'
);

select results_eq(
  $$
    with changed as (
      update public.clients
      set first_name = 'Changed'
      where id = '20000000-0000-4000-8000-000000000011'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (0) $$,
  'normal users cannot update another owners client'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000013', true);

select is(
  (
    select count(*)::integer
    from public.clients
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  1,
  'admin can read another owners active client'
);

select results_eq(
  $$
    with changed as (
      update public.clients
      set phone_number = '+54 11 5555 0102'
      where id = '20000000-0000-4000-8000-000000000011'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (1) $$,
  'admin can update another owners active client'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);

select lives_ok(
  $$
    update public.clients
    set deleted_at = current_timestamp
    where id = '20000000-0000-4000-8000-000000000011'
  $$,
  'owner can soft-delete own client'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = '10000000-0000-4000-8000-000000000011'
      and client_id is null
  ),
  1,
  'soft-deleting a client unlinks active projects'
);

select is(
  (
    select count(*)::integer
    from public.clients
    where id = '20000000-0000-4000-8000-000000000011'
      and deleted_at is null
  ),
  0,
  'soft-deleted clients are excluded from active reads'
);

select results_eq(
  $$
    with changed as (
      update public.clients
      set first_name = 'Restored'
      where id = '20000000-0000-4000-8000-000000000011'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (0) $$,
  'owners cannot modify an archived client'
);

select throws_ok(
  $$
    update public.projects
    set client_id = '20000000-0000-4000-8000-000000000011'
    where id = '10000000-0000-4000-8000-000000000011'
  $$,
  '23503',
  'Project client is unavailable.',
  'archived clients cannot be linked to projects'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select throws_ok(
  $$ select * from public.clients $$,
  '42501',
  null,
  'anonymous users have no client table access'
);

select throws_ok(
  $$ insert into public.clients (owner_id, first_name) values (gen_random_uuid(), 'Anon') $$,
  '42501',
  null,
  'anonymous users cannot create clients'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.clients
    where id = '20000000-0000-4000-8000-000000000011'
      and deleted_at is not null
  ),
  1,
  'client remains soft-deleted in storage'
);

select * from finish();
rollback;
