begin;

create extension if not exists pgtap with schema extensions;

select plan(33);

insert into public.users (id, first_name, email, role)
values
  ('00000000-0000-4000-8000-000000000031', 'Worker Owner', 'worker-owner@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000032', 'Other Owner', 'worker-other@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000033', 'Worker Admin', 'worker-admin@example.com', 'admin');

insert into public.contractors (id, owner_id, first_name)
values
  (
    '30000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    'Owner Contractor'
  ),
  (
    '30000000-0000-4000-8000-000000000032',
    '00000000-0000-4000-8000-000000000032',
    'Other Contractor'
  );

insert into public.trade_categories (id, code, deleted_at)
values (
  '40000000-0000-4000-8000-000000000039',
  'archived_worker_trade',
  current_timestamp
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    select public.create_worker_with_relationships(
      p_first_name => '  Alex  ',
      p_last_name => '  Morgan  ',
      p_phone_number => '  +54 11 5555 0101  ',
      p_email => '  WORKER@EXAMPLE.COM  ',
      p_contractor_id => '30000000-0000-4000-8000-000000000031',
      p_trade_category_ids => array[
        (select id from public.trade_categories where code = 'general_site_work'),
        (select id from public.trade_categories where code = 'carpentry_woodwork')
      ]
    )
  $$,
  'owner can atomically create a worker with relationships'
);

select is(
  (
    select first_name || '|' || last_name || '|' || phone_number || '|' || email
    from public.workers
    where email = 'worker@example.com'
  ),
  'Alex|Morgan|+54 11 5555 0101|worker@example.com',
  'worker contact fields are normalized'
);

select is(
  (
    select count(*)::integer
    from public.worker_trade_categories
    where worker_id = (
      select id from public.workers where email = 'worker@example.com'
    )
  ),
  2,
  'atomic create stores every selected trade category'
);

select is(
  (
    select count(*)::integer
    from public.workers
    where email = 'worker@example.com'
      and deleted_at is null
  ),
  1,
  'owner can read own active worker'
);

select is(
  has_table_privilege('authenticated', 'public.workers', 'SELECT'),
  true,
  'authenticated role can select workers'
);

select is(
  has_table_privilege('authenticated', 'public.workers', 'DELETE'),
  false,
  'authenticated role cannot hard-delete workers'
);

select is(
  has_table_privilege(
    'authenticated',
    'public.worker_trade_categories',
    'DELETE'
  ),
  true,
  'authenticated role can replace worker trade links through RLS'
);

select throws_ok(
  $$
    insert into public.workers (owner_id, first_name)
    values ('00000000-0000-4000-8000-000000000032', 'Not Mine')
  $$,
  '42501',
  null,
  'owner cannot create a worker for another user'
);

select throws_ok(
  $$
    select public.create_worker_with_relationships(
      p_first_name => 'Wrong Contractor',
      p_contractor_id => '30000000-0000-4000-8000-000000000032'
    )
  $$,
  '23503',
  null,
  'owner cannot link a worker to another owners contractor'
);

select throws_ok(
  $$
    select public.create_worker_with_relationships(
      p_first_name => 'Invalid Trade',
      p_trade_category_ids => array[
        '40000000-0000-4000-8000-000000000038'::uuid
      ]
    )
  $$,
  '23503',
  null,
  'atomic create rejects an unavailable trade category'
);

select is(
  (
    select count(*)::integer
    from public.workers
    where first_name = 'Invalid Trade'
  ),
  0,
  'failed atomic create leaves no partial worker'
);

select throws_ok(
  $$
    select public.create_worker_with_relationships(
      p_first_name => 'Archived Trade',
      p_trade_category_ids => array[
        '40000000-0000-4000-8000-000000000039'::uuid
      ]
    )
  $$,
  '23503',
  null,
  'atomic create rejects an archived trade category'
);

select lives_ok(
  $$
    select public.update_worker_with_relationships(
      p_worker_id => (
        select id from public.workers where email = 'worker@example.com'
      ),
      p_first_name => 'Alex',
      p_last_name => 'Morgan',
      p_phone_number => '+54 11 5555 0102',
      p_email => 'worker@example.com',
      p_contractor_id => '30000000-0000-4000-8000-000000000031',
      p_trade_category_ids => array[
        (select id from public.trade_categories where code = 'electrical_low_voltage_systems')
      ]
    )
  $$,
  'owner can atomically update a worker and replace relationships'
);

select is(
  (
    select count(*)::integer
    from public.worker_trade_categories
    where worker_id = (
      select id from public.workers where email = 'worker@example.com'
    )
  ),
  1,
  'atomic update replaces the complete trade-category set'
);

select is(
  (
    select contractor_id
    from public.workers
    where email = 'worker@example.com'
  ),
  '30000000-0000-4000-8000-000000000031'::uuid,
  'atomic update stores the selected contractor'
);

select throws_ok(
  $$
    select public.update_worker_with_relationships(
      p_worker_id => (
        select id from public.workers where email = 'worker@example.com'
      ),
      p_first_name => 'Alex',
      p_trade_category_ids => array[
        (select id from public.trade_categories where code = 'general_site_work'),
        (select id from public.trade_categories where code = 'general_site_work')
      ]
    )
  $$,
  '22023',
  null,
  'atomic update rejects duplicate trade-category ids'
);

select throws_ok(
  $$
    update public.workers
    set owner_id = '00000000-0000-4000-8000-000000000032'
    where email = 'worker@example.com'
  $$,
  '42501',
  null,
  'owner cannot transfer worker ownership'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000032', true);

select is(
  (
    select count(*)::integer
    from public.workers
    where email = 'worker@example.com'
  ),
  0,
  'normal users cannot read another owners worker'
);

select results_eq(
  $$
    with changed as (
      update public.workers
      set first_name = 'Changed'
      where email = 'worker@example.com'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (0) $$,
  'normal users cannot update another owners worker'
);

select is(
  (
    select count(*)::integer
    from public.worker_trade_categories
    where worker_id = (
      select id from public.workers where email = 'worker@example.com'
    )
  ),
  0,
  'normal users cannot read another owners trade links'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000033', true);

select is(
  (
    select count(*)::integer
    from public.workers
    where email = 'worker@example.com'
  ),
  1,
  'admin can read another owners active worker'
);

select lives_ok(
  $$
    select public.update_worker_with_relationships(
      p_worker_id => (
        select id from public.workers where email = 'worker@example.com'
      ),
      p_first_name => 'Admin Updated',
      p_email => 'worker@example.com',
      p_contractor_id => '30000000-0000-4000-8000-000000000031',
      p_trade_category_ids => array[
        (select id from public.trade_categories where code = 'general_site_work')
      ]
    )
  $$,
  'admin can update another owners worker without changing ownership'
);

select is(
  (
    select count(*)::integer
    from public.worker_trade_categories
    where worker_id = (
      select id from public.workers where email = 'worker@example.com'
    )
  ),
  1,
  'admin can read another owners trade links'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);

select lives_ok(
  $$
    update public.contractors
    set deleted_at = current_timestamp
    where id = '30000000-0000-4000-8000-000000000031'
  $$,
  'owner can archive a contractor linked to workers'
);

select is(
  (
    select contractor_id
    from public.workers
    where email = 'worker@example.com'
  ),
  null,
  'archiving a contractor unlinks active workers'
);

select throws_ok(
  $$
    select public.create_worker_with_relationships(
      p_first_name => 'Archived Contractor',
      p_contractor_id => '30000000-0000-4000-8000-000000000031'
    )
  $$,
  '23503',
  null,
  'archived contractors cannot be linked to new workers'
);

select lives_ok(
  $$
    update public.workers
    set deleted_at = current_timestamp
    where email = 'worker@example.com'
  $$,
  'owner can soft-delete own worker'
);

select is(
  (
    select count(*)::integer
    from public.workers
    where email = 'worker@example.com'
  ),
  0,
  'RLS hides a soft-deleted worker'
);

select results_eq(
  $$
    with changed as (
      update public.workers
      set first_name = 'Restored'
      where email = 'worker@example.com'
      returning 1
    )
    select count(*)::integer from changed
  $$,
  $$ values (0) $$,
  'owners cannot modify an archived worker'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select throws_ok(
  $$ select * from public.workers $$,
  '42501',
  null,
  'anonymous users have no worker table access'
);

select throws_ok(
  $$ select * from public.worker_trade_categories $$,
  '42501',
  null,
  'anonymous users have no worker trade-link access'
);

select throws_ok(
  $$ select public.create_worker_with_relationships(p_first_name => 'Anon') $$,
  '42501',
  null,
  'anonymous users cannot call worker save functions'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.workers
    where email = 'worker@example.com'
      and deleted_at is not null
  ),
  1,
  'worker remains soft-deleted in storage'
);

select * from finish();
rollback;
