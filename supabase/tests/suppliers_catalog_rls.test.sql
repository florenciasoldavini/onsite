begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

insert into public.users (id, first_name, email, role)
values
  ('00000000-0000-4000-8000-000000000041', 'Supplier Owner', 'supplier-owner@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000042', 'Other Owner', 'supplier-other@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000043', 'Supplier Admin', 'supplier-admin@example.com', 'admin');

insert into public.suppliers (id, owner_id, name)
values (
  '40000000-0000-4000-8000-000000000042',
  '00000000-0000-4000-8000-000000000042',
  'Other Supplier'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000041', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    insert into public.suppliers (
      id,
      owner_id,
      name,
      contact_name,
      phone_number,
      email,
      website_url,
      address,
      google_place_id,
      latitude,
      longitude,
      notes
    )
    values (
      '40000000-0000-4000-8000-000000000041',
      '00000000-0000-4000-8000-000000000041',
      '  Patagonia Supply  ',
      '  Alex Morgan  ',
      '  +54 11 5555 0101  ',
      '  SALES@EXAMPLE.COM  ',
      '  https://supplier.example/Catalog  ',
      '  Av. Corrientes 1234  ',
      '  place-123  ',
      -34.6037,
      -58.3816,
      '  Friday delivery  '
    )
  $$,
  'owner can create own supplier'
);

select is(
  (
    select name || '|' || contact_name || '|' || email || '|' || notes
    from public.suppliers
    where id = '40000000-0000-4000-8000-000000000041'
  ),
  'Patagonia Supply|Alex Morgan|sales@example.com|Friday delivery',
  'supplier fields are normalized'
);

select is(
  (
    select website_url
    from public.suppliers
    where id = '40000000-0000-4000-8000-000000000041'
  ),
  'https://supplier.example/Catalog',
  'website paths preserve their case'
);

select throws_ok(
  $$
    insert into public.suppliers (owner_id, name)
    values ('00000000-0000-4000-8000-000000000042', 'Not Mine')
  $$,
  '42501',
  null,
  'owner cannot create a supplier for another user'
);

select throws_ok(
  $$
    insert into public.suppliers (
      owner_id,
      name,
      address
    )
    values (
      '00000000-0000-4000-8000-000000000041',
      'Incomplete Address',
      'Main Street 1'
    )
  $$,
  '23514',
  null,
  'address data must be saved as a complete resolved bundle'
);

select throws_ok(
  $$
    insert into public.suppliers (owner_id, name, website_url)
    values (
      '00000000-0000-4000-8000-000000000041',
      'Bad Website',
      'ftp://supplier.example'
    )
  $$,
  '23514',
  null,
  'database accepts only HTTP and HTTPS websites'
);

select is(
  has_table_privilege('authenticated', 'public.suppliers', 'SELECT'),
  true,
  'authenticated role can select suppliers'
);

select is(
  has_table_privilege('authenticated', 'public.suppliers', 'DELETE'),
  false,
  'authenticated role cannot hard-delete suppliers'
);

select is(
  (
    select count(*)::integer
    from public.suppliers
    where id = '40000000-0000-4000-8000-000000000041'
  ),
  1,
  'owner can read own active supplier'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000042', true);

select is(
  (
    select count(*)::integer
    from public.suppliers
    where id = '40000000-0000-4000-8000-000000000041'
  ),
  0,
  'normal users cannot read another owners supplier'
);

select results_eq(
  $$
    with changed as (
      update public.suppliers
      set name = 'Changed'
      where id = '40000000-0000-4000-8000-000000000041'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (0) $$,
  'normal users cannot update another owners supplier'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000043', true);

select is(
  (
    select count(*)::integer
    from public.suppliers
    where id = '40000000-0000-4000-8000-000000000041'
  ),
  1,
  'admin can read another owners active supplier'
);

select results_eq(
  $$
    with changed as (
      update public.suppliers
      set phone_number = '+54 11 5555 0102'
      where id = '40000000-0000-4000-8000-000000000041'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (1) $$,
  'admin can update another owners active supplier'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000041', true);

select throws_ok(
  $$
    update public.suppliers
    set owner_id = '00000000-0000-4000-8000-000000000042'
    where id = '40000000-0000-4000-8000-000000000041'
  $$,
  '42501',
  null,
  'owner cannot transfer supplier ownership'
);

select lives_ok(
  $$
    update public.suppliers
    set deleted_at = current_timestamp
    where id = '40000000-0000-4000-8000-000000000041'
  $$,
  'owner can soft-delete own supplier'
);

select is(
  (
    select count(*)::integer
    from public.suppliers
    where id = '40000000-0000-4000-8000-000000000041'
      and deleted_at is null
  ),
  0,
  'active supplier reads hide a soft-deleted supplier'
);

select results_eq(
  $$
    with changed as (
      update public.suppliers
      set name = 'Restored'
      where id = '40000000-0000-4000-8000-000000000041'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (0) $$,
  'owners cannot modify an archived supplier'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select throws_ok(
  $$ select * from public.suppliers $$,
  '42501',
  null,
  'anonymous users have no supplier table access'
);

select throws_ok(
  $$ insert into public.suppliers (owner_id, name) values (gen_random_uuid(), 'Anon') $$,
  '42501',
  null,
  'anonymous users cannot create suppliers'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.suppliers
    where id = '40000000-0000-4000-8000-000000000041'
      and deleted_at is not null
  ),
  1,
  'supplier remains soft-deleted in storage'
);

select * from finish();
rollback;
