begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

select is(
  (select count(*)::integer from public.trade_categories),
  10,
  'the system catalog contains the ten fixed trade categories'
);

insert into public.trade_categories (id, code)
values (
  '20000000-0000-4000-8000-000000000001',
  'retired_trade_category'
);

update public.trade_categories
set deleted_at = current_timestamp
where id = '20000000-0000-4000-8000-000000000001';

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select throws_ok(
  $$ select count(*) from public.trade_categories $$,
  '42501',
  null,
  'anonymous clients cannot read trade categories'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.trade_categories),
  10,
  'authenticated users can read the ten active trade categories only'
);

select is(
  (
    select code
    from public.trade_categories
    where code = 'carpentry_woodwork'
  ),
  'carpentry_woodwork',
  'the catalog stores stable language-neutral codes'
);

select throws_ok(
  $$
    insert into public.trade_categories (code)
    values ('client_trade_category')
  $$,
  '42501',
  null,
  'authenticated users cannot create trade categories'
);

select throws_ok(
  $$
    update public.trade_categories
    set code = 'changed_by_client'
    where code = 'carpentry_woodwork'
  $$,
  '42501',
  null,
  'authenticated users cannot edit trade categories'
);

select throws_ok(
  $$
    delete from public.trade_categories
    where code = 'carpentry_woodwork'
  $$,
  '42501',
  null,
  'authenticated users cannot delete trade categories'
);

select * from finish();

rollback;
