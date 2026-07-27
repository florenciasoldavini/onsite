begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into public.users (id, first_name, email, role)
values
  ('00000000-0000-4000-8000-000000000021', 'Contractor Owner', 'contractor-owner@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000022', 'Other Owner', 'contractor-other@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000023', 'Contractor Admin', 'contractor-admin@example.com', 'admin');

insert into public.contractors (
  id,
  owner_id,
  first_name
)
values (
  '20000000-0000-4000-8000-000000000022',
  '00000000-0000-4000-8000-000000000022',
  'Other Contractor'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000021', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    insert into public.contractors (
      id,
      owner_id,
      first_name,
      last_name,
      phone_number,
      email
    )
    values (
      '20000000-0000-4000-8000-000000000021',
      '00000000-0000-4000-8000-000000000021',
      '  Alex  ',
      '  Morgan  ',
      '  +54 11 5555 0101  ',
      '  FOREMAN@EXAMPLE.COM  '
    )
  $$,
  'owner can create own contractor'
);

select is(
  (
    select first_name || '|' || last_name || '|' || phone_number || '|' || email
    from public.contractors
    where id = '20000000-0000-4000-8000-000000000021'
  ),
  'Alex|Morgan|+54 11 5555 0101|foreman@example.com',
  'contact fields are normalized'
);

select throws_ok(
  $$
    insert into public.contractors (owner_id, first_name)
    values ('00000000-0000-4000-8000-000000000022', 'Not Mine')
  $$,
  '42501',
  null,
  'owner cannot create a contractor for another user'
);

select is(
  (
    select count(*)::integer
    from public.contractors
    where id = '20000000-0000-4000-8000-000000000021'
      and deleted_at is null
  ),
  1,
  'owner can read own active contractor'
);

select is(
  has_table_privilege('authenticated', 'public.contractors', 'SELECT'),
  true,
  'authenticated role can select contractors'
);

select is(
  has_table_privilege('authenticated', 'public.contractors', 'DELETE'),
  false,
  'authenticated role cannot hard-delete contractors'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000022', true);

select is(
  (
    select count(*)::integer
    from public.contractors
    where id = '20000000-0000-4000-8000-000000000021'
  ),
  0,
  'normal users cannot read another owners contractor'
);

select results_eq(
  $$
    with changed as (
      update public.contractors
      set first_name = 'Changed'
      where id = '20000000-0000-4000-8000-000000000021'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (0) $$,
  'normal users cannot update another owners contractor'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000023', true);

select is(
  (
    select count(*)::integer
    from public.contractors
    where id = '20000000-0000-4000-8000-000000000021'
      and deleted_at is null
  ),
  1,
  'admin can read another owners active contractor'
);

select results_eq(
  $$
    with changed as (
      update public.contractors
      set phone_number = '+54 11 5555 0102'
      where id = '20000000-0000-4000-8000-000000000021'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (1) $$,
  'admin can update another owners active contractor'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000021', true);

select throws_ok(
  $$
    update public.contractors
    set owner_id = '00000000-0000-4000-8000-000000000022'
    where id = '20000000-0000-4000-8000-000000000021'
  $$,
  '42501',
  null,
  'owner cannot transfer contractor ownership'
);

select lives_ok(
  $$
    update public.contractors
    set deleted_at = current_timestamp
    where id = '20000000-0000-4000-8000-000000000021'
  $$,
  'owner can soft-delete own contractor'
);

select is(
  (
    select count(*)::integer
    from public.contractors
    where id = '20000000-0000-4000-8000-000000000021'
      and deleted_at is null
  ),
  0,
  'active contractor reads hide a soft-deleted contractor'
);

select results_eq(
  $$
    with changed as (
      update public.contractors
      set first_name = 'Restored'
      where id = '20000000-0000-4000-8000-000000000021'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (0) $$,
  'owners cannot modify an archived contractor'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select throws_ok(
  $$ select * from public.contractors $$,
  '42501',
  null,
  'anonymous users have no contractor table access'
);

select throws_ok(
  $$ insert into public.contractors (owner_id, first_name) values (gen_random_uuid(), 'Anon') $$,
  '42501',
  null,
  'anonymous users cannot create contractors'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.contractors
    where id = '20000000-0000-4000-8000-000000000021'
      and deleted_at is not null
  ),
  1,
  'contractor remains soft-deleted in storage'
);

select * from finish();
rollback;
