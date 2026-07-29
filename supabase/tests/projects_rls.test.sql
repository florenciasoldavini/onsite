begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

-- Supabase Storage sets this transaction-local flag before issuing delete
-- queries. It permits the SQL statement without bypassing storage.objects RLS.
select set_config('storage.allow_delete_query', 'true', true);

select is(
  (select public from storage.buckets where id = 'user-avatars'),
  false,
  'user avatars bucket is private'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'user_avatars_read_authenticated'
      and qual like '%storage.object.sign%'
  ),
  1,
  'authenticated avatar reads support signed URLs without public bucket access'
);

insert into public.users (
  id,
  first_name,
  email,
  role
)
values
  ('00000000-0000-4000-8000-000000000001', 'Owner', 'owner@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000002', 'Other', 'other@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000003', 'Admin', 'admin@example.com', 'admin')
on conflict (id) do update
set
  first_name = excluded.first_name,
  email = excluded.email,
  role = excluded.role,
  deleted_at = null;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    insert into public.projects (
      id,
      owner_id,
      name,
      address,
      google_place_id,
      latitude,
      longitude
    )
    values (
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      'Owner Project',
      '1 Owner Street',
      'owner-place',
      -34.6037,
      -58.3816
    )
  $$,
  'owner can create own project'
);

select throws_ok(
  $$
    insert into public.projects (
      id,
      owner_id,
      name,
      address,
      google_place_id,
      latitude,
      longitude
    )
    values (
      '10000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000002',
      'Other Owned Project',
      '2 Other Street',
      'other-place',
      -34.6,
      -58.4
    )
  $$,
  '42501',
  null,
  'normal user cannot create project for another owner'
);

select is(
  (select count(*)::integer from public.projects where id = '10000000-0000-4000-8000-000000000001'),
  1,
  'owner can read own non-deleted project'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.projects where id = '10000000-0000-4000-8000-000000000001'),
  0,
  'normal user cannot read another user project'
);

select results_eq(
  $$
    with updated as (
      update public.projects
      set name = 'Unauthorized Update'
      where id = '10000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::integer from updated
  $$,
  $$ values (0) $$,
  'normal user cannot update another user project'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);

select is(
  (select count(*)::integer from public.projects where id = '10000000-0000-4000-8000-000000000001'),
  1,
  'admin can read all non-deleted projects'
);

select results_eq(
  $$
    with updated as (
      update public.projects
      set status = 'in_progress'
      where id = '10000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::integer from updated
  $$,
  $$ values (1) $$,
  'admin can update another user project'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select results_eq(
  $$
    with updated as (
      update public.projects
      set deleted_at = current_timestamp
      where id = '10000000-0000-4000-8000-000000000001'
      returning 1
    )
    select count(*)::integer from updated
  $$,
  $$ values (1) $$,
  'owner can soft-delete own project through a returning update'
);

select is(
  (select count(*)::integer from public.projects where id = '10000000-0000-4000-8000-000000000001'),
  0,
  'archived projects are inaccessible even to their owner'
);

select is(
  (
    select count(*)::integer
    from public.projects
    where id = '10000000-0000-4000-8000-000000000001'
      and deleted_at is null
  ),
  0,
  'active project reads hide the owner soft-deleted project'
);

reset role;

insert into public.projects (
  id,
  owner_id,
  name,
  address,
  google_place_id,
  latitude,
  longitude
)
values (
  '10000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  'Storage Project',
  '3 Cover Street',
  'storage-place',
  -34.61,
  -58.39
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      metadata
    )
    values (
      'project-covers',
      'projects/10000000-0000-4000-8000-000000000003/cover/test.jpg',
      '00000000-0000-4000-8000-000000000001',
      '{"mimetype":"image/jpeg"}'::jsonb
    )
  $$,
  'owner can insert a cover object for own project'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-covers'
      and name = 'projects/10000000-0000-4000-8000-000000000003/cover/test.jpg'
  ),
  0,
  'normal user cannot read another project cover object'
);

select results_eq(
  $$
    with deleted as (
      delete from storage.objects
      where bucket_id = 'project-covers'
        and name = 'projects/10000000-0000-4000-8000-000000000003/cover/test.jpg'
      returning 1
    )
    select count(*)::integer from deleted
  $$,
  $$ values (0) $$,
  'normal user cannot delete another project cover object'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-covers'
      and name = 'projects/10000000-0000-4000-8000-000000000003/cover/test.jpg'
  ),
  1,
  'admin can read any non-deleted project cover object'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select results_eq(
  $$
    with deleted as (
      delete from storage.objects
      where bucket_id = 'project-covers'
        and name = 'projects/10000000-0000-4000-8000-000000000003/cover/test.jpg'
      returning 1
    )
    select count(*)::integer from deleted
  $$,
  $$ values (1) $$,
  'owner can delete a cover object for own project'
);

select lives_ok(
  $$
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      metadata
    )
    values (
      'user-avatars',
      'users/00000000-0000-4000-8000-000000000001/avatar/profile.jpg',
      '00000000-0000-4000-8000-000000000001',
      '{"mimetype":"image/jpeg"}'::jsonb
    )
  $$,
  'user can insert own avatar object'
);

select results_eq(
  $$
    with updated as (
      update storage.objects
      set metadata = '{"mimetype":"image/jpeg","updated":true}'::jsonb
      where bucket_id = 'user-avatars'
        and name = 'users/00000000-0000-4000-8000-000000000001/avatar/profile.jpg'
      returning 1
    )
    select count(*)::integer from updated
  $$,
  $$ values (1) $$,
  'user can update own avatar object'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'user-avatars'
      and name = 'users/00000000-0000-4000-8000-000000000001/avatar/profile.jpg'
  ),
  0,
  'user cannot list another user avatar object'
);

select results_eq(
  $$
    with deleted as (
      delete from storage.objects
      where bucket_id = 'user-avatars'
        and name = 'users/00000000-0000-4000-8000-000000000001/avatar/profile.jpg'
      returning 1
    )
    select count(*)::integer from deleted
  $$,
  $$ values (0) $$,
  'user cannot delete another user avatar object'
);

select throws_ok(
  $$
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      metadata
    )
    values (
      'user-avatars',
      'users/00000000-0000-4000-8000-000000000001/avatar/hack.jpg',
      '00000000-0000-4000-8000-000000000002',
      '{"mimetype":"image/jpeg"}'::jsonb
    )
  $$,
  '42501',
  null,
  'user cannot insert avatar object under another user folder'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select results_eq(
  $$
    with deleted as (
      delete from storage.objects
      where bucket_id = 'user-avatars'
        and name = 'users/00000000-0000-4000-8000-000000000001/avatar/profile.jpg'
      returning 1
    )
    select count(*)::integer from deleted
  $$,
  $$ values (1) $$,
  'user can delete own avatar object'
);

select * from finish();

rollback;
