begin;

create extension if not exists pgtap with schema extensions;

select plan(31);

select set_config('storage.allow_delete_query', 'true', true);

select is(
  (select public from storage.buckets where id = 'project-photos'),
  false,
  'project photos bucket is private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'project-photos'),
  6291456::bigint,
  'project photos bucket limits each JPEG object to 6 MiB'
);

select is(
  (
    select allowed_mime_types
    from storage.buckets
    where id = 'project-photos'
  ),
  array['image/jpeg']::text[],
  'project photos bucket accepts JPEG objects only'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.project_photos',
    'DELETE'
  ),
  'authenticated users have no direct row delete grant'
);

insert into public.users (id, first_name, email, role)
values
  ('00000000-0000-4000-8000-000000000011', 'Owner', 'photos-owner@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000012', 'Other', 'photos-other@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000013', 'Admin', 'photos-admin@example.com', 'admin')
on conflict (id) do update
set
  first_name = excluded.first_name,
  email = excluded.email,
  role = excluded.role,
  deleted_at = null;

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
    'Photo Project',
    '11 Photo Street',
    'photo-place-11',
    -34.6037,
    -58.3816
  ),
  (
    '10000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000012',
    'Other Photo Project',
    '12 Photo Street',
    'photo-place-12',
    -34.61,
    -58.39
  ),
  (
    '10000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000011',
    'Archived Photo Project',
    '13 Photo Street',
    'photo-place-13',
    -34.62,
    -58.40
  )
on conflict (id) do update
set deleted_at = null;

update public.projects
set deleted_at = current_timestamp
where id = '10000000-0000-4000-8000-000000000013';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000011',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    insert into public.project_photos (
      id,
      project_id,
      full_path,
      thumbnail_path,
      captured_at,
      latitude,
      longitude,
      location_source,
      mime_type,
      width,
      height,
      file_size_bytes
    )
    values (
      '20000000-0000-4000-8000-000000000011',
      '10000000-0000-4000-8000-000000000011',
      'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000011/full.jpg',
      'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000011/thumbnail.jpg',
      '2026-07-27T18:00:00Z',
      -34.6037,
      -58.3816,
      'photo_exif',
      'image/jpeg',
      2400,
      1800,
      524288
    )
  $$,
  'project owner can insert a project photo'
);

select is(
  (
    select owner_id
    from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  '00000000-0000-4000-8000-000000000011'::uuid,
  'photo owner is derived from the active project'
);

select is(
  (
    select uploaded_by
    from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  '00000000-0000-4000-8000-000000000011'::uuid,
  'photo uploader is derived from auth.uid'
);

select throws_ok(
  $$
    insert into public.project_photos (
      id,
      project_id,
      owner_id,
      uploaded_by,
      full_path,
      thumbnail_path,
      width,
      height,
      file_size_bytes
    )
    values (
      '20000000-0000-4000-8000-000000000010',
      '10000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000013',
      '00000000-0000-4000-8000-000000000013',
      'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000010/full.jpg',
      'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000010/thumbnail.jpg',
      100,
      100,
      1000
    )
  $$,
  '42501',
  null,
  'clients cannot assign forged owner or uploader values'
);

select is(
  (
    select kind::text
    from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  'general',
  'photo category defaults to general'
);

select is(
  (
    select is_marketing
    from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  false,
  'marketing defaults off'
);

select lives_ok(
  $$
    update public.project_photos
    set kind = 'issue', is_marketing = true, caption = 'Water ingress'
    where id = '20000000-0000-4000-8000-000000000011'
  $$,
  'owner can edit photo metadata'
);

select results_eq(
  $$
    select kind::text, is_marketing
    from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
  $$,
  $$ values ('issue', true) $$,
  'marketing remains independent from the operational category'
);

select throws_ok(
  $$
    insert into public.project_photos (
      id,
      project_id,
      full_path,
      thumbnail_path,
      width,
      height,
      file_size_bytes
    )
    values (
      '20000000-0000-4000-8000-000000000014',
      '10000000-0000-4000-8000-000000000011',
      'projects/wrong/photos/20000000-0000-4000-8000-000000000014/full.jpg',
      'projects/wrong/photos/20000000-0000-4000-8000-000000000014/thumbnail.jpg',
      100,
      100,
      1000
    )
  $$,
  '23514',
  null,
  'database rejects object paths outside the immutable photo path'
);

select throws_ok(
  $$
    update public.project_photos
    set caption = repeat('a', 1001)
    where id = '20000000-0000-4000-8000-000000000011'
  $$,
  '23514',
  null,
  'database rejects captions over 1,000 characters'
);

select throws_ok(
  $$
    insert into public.project_photos (
      id,
      project_id,
      full_path,
      thumbnail_path,
      latitude,
      width,
      height,
      file_size_bytes
    )
    values (
      '20000000-0000-4000-8000-000000000015',
      '10000000-0000-4000-8000-000000000011',
      'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000015/full.jpg',
      'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000015/thumbnail.jpg',
      -34.6,
      100,
      100,
      1000
    )
  $$,
  '23514',
  null,
  'database rejects partial location bundles'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000012',
  true
);

select is(
  (
    select count(*)::integer
    from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  0,
  'normal user cannot read another owner photo'
);

select results_eq(
  $$
    with updated as (
      update public.project_photos
      set caption = 'Unauthorized'
      where id = '20000000-0000-4000-8000-000000000011'
      returning 1
    )
    select count(*)::integer from updated
  $$,
  $$ values (0) $$,
  'normal user cannot edit another owner photo'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000013',
  true
);

select is(
  (
    select count(*)::integer
    from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
  ),
  1,
  'admin can read another owner photo'
);

select results_eq(
  $$
    with updated as (
      update public.project_photos
      set caption = 'Admin review'
      where id = '20000000-0000-4000-8000-000000000011'
      returning 1
    )
    select count(*)::integer from updated
  $$,
  $$ values (1) $$,
  'admin can edit another owner photo metadata'
);

select throws_ok(
  $$
    update public.project_photos
    set project_id = '10000000-0000-4000-8000-000000000012'
    where id = '20000000-0000-4000-8000-000000000011'
  $$,
  '42501',
  null,
  'clients cannot change immutable project assignment'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000011',
  true
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'project-photos',
      'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000011/full.jpg',
      '00000000-0000-4000-8000-000000000011',
      '{"mimetype":"image/jpeg"}'::jsonb
    )
  $$,
  'owner can insert an immutable object for an accessible project'
);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-photos'
      and name = 'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000011/full.jpg'
  ),
  1,
  'owner can read an object referenced by an active photo row'
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'project-photos',
      'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000099/full.jpg',
      '00000000-0000-4000-8000-000000000011',
      '{"mimetype":"image/jpeg"}'::jsonb
    )
  $$,
  'owner can stage an object before its database row exists'
);

select set_config('storage.operation', 'storage.object.upload', true);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-photos'
      and name = 'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000099/full.jpg'
  ),
  1,
  'Storage can return staged object metadata during its upload request'
);

select set_config('storage.operation', '', true);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-photos'
      and name = 'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000099/full.jpg'
  ),
  0,
  'orphaned staged objects are unreadable'
);

select lives_ok(
  $$
    update public.project_photos
    set deleted_at = current_timestamp
    where id = '20000000-0000-4000-8000-000000000011'
  $$,
  'owner can soft-delete an active photo'
);

select is(
  (
    select count(*)::integer
    from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
      and deleted_at is null
  ),
  0,
  'product reads exclude soft-deleted photos'
);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-photos'
      and name = 'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000011/full.jpg'
  ),
  0,
  'objects become unreadable when their photo row is soft-deleted'
);

select lives_ok(
  $$
    delete from storage.objects
    where bucket_id = 'project-photos'
      and name = 'projects/10000000-0000-4000-8000-000000000011/photos/20000000-0000-4000-8000-000000000011/full.jpg'
  $$,
  'owner can clean up an object after soft deletion'
);

select throws_ok(
  $$
    delete from public.project_photos
    where id = '20000000-0000-4000-8000-000000000011'
  $$,
  '42501',
  null,
  'authenticated users cannot directly delete photo rows'
);

select throws_ok(
  $$
    insert into public.project_photos (
      id,
      project_id,
      full_path,
      thumbnail_path,
      width,
      height,
      file_size_bytes
    )
    values (
      '20000000-0000-4000-8000-000000000013',
      '10000000-0000-4000-8000-000000000013',
      'projects/10000000-0000-4000-8000-000000000013/photos/20000000-0000-4000-8000-000000000013/full.jpg',
      'projects/10000000-0000-4000-8000-000000000013/photos/20000000-0000-4000-8000-000000000013/thumbnail.jpg',
      100,
      100,
      1000
    )
  $$,
  '23503',
  null,
  'photos cannot be added to archived projects'
);

select * from finish();
rollback;
