begin;

create extension if not exists pgtap with schema extensions;

select plan(37);

select set_config('storage.allow_delete_query', 'true', true);

select is(
  (select public from storage.buckets where id = 'project-documents'),
  false,
  'project documents bucket is private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'project-documents'),
  26214400::bigint,
  'project documents bucket limits objects to 25 MiB'
);

select is(
  (
    select allowed_mime_types
    from storage.buckets
    where id = 'project-documents'
  ),
  array['application/pdf', 'image/jpeg', 'image/png']::text[],
  'project documents bucket accepts the three supported MIME types'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.project_documents',
    'DELETE'
  ),
  'authenticated users have no direct row delete grant'
);

select ok(
  exists (
    select 1
    from public.project_permissions
    where code = 'project.documents.write'
  ),
  'the document write capability is seeded'
);

select ok(
  exists (
    select 1
    from public.project_role_permissions
    where role_code = 'owner'
      and permission_code = 'project.documents.write'
  ),
  'owners receive document write access'
);

select ok(
  exists (
    select 1
    from public.project_role_permissions
    where role_code = 'manager'
      and permission_code = 'project.documents.write'
  ),
  'managers receive document write access'
);

select ok(
  not exists (
    select 1
    from public.project_role_permissions
    where role_code = 'contributor'
      and permission_code = 'project.documents.write'
  ),
  'contributors remain document read-only'
);

select ok(
  not exists (
    select 1
    from public.project_role_permissions
    where role_code = 'viewer'
      and permission_code = 'project.documents.write'
  ),
  'viewers remain document read-only'
);

insert into public.users (id, first_name, last_name, email, role)
values
  ('00000000-0000-4000-8000-000000000201', 'Document', 'Owner', 'documents-owner@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000202', 'Document', 'Manager', 'documents-manager@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000203', 'Document', 'Contributor', 'documents-contributor@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000204', 'Document', 'Viewer', 'documents-viewer@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000205', 'Removed', 'Manager', 'documents-removed@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000206', 'Project', 'Outsider', 'documents-outsider@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000207', 'Global', 'Admin', 'documents-admin@example.com', 'admin');

insert into public.projects (
  id,
  owner_id,
  name,
  address,
  google_place_id,
  latitude,
  longitude,
  deleted_at
)
values
  (
    '10000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000201',
    'Document Project',
    '201 Document Street',
    'documents-place-201',
    -34.6037,
    -58.3816,
    null
  ),
  (
    '10000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000201',
    'Archived Document Project',
    '202 Document Street',
    'documents-place-202',
    -34.61,
    -58.39,
    current_timestamp
  );

insert into public.project_memberships (
  id,
  project_id,
  user_id,
  role_code,
  invited_by,
  removed_at,
  removed_by
)
values
  (
    '30000000-0000-4000-8000-000000000202',
    '10000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000202',
    'manager',
    '00000000-0000-4000-8000-000000000201',
    null,
    null
  ),
  (
    '30000000-0000-4000-8000-000000000203',
    '10000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000203',
    'contributor',
    '00000000-0000-4000-8000-000000000201',
    null,
    null
  ),
  (
    '30000000-0000-4000-8000-000000000204',
    '10000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000204',
    'viewer',
    '00000000-0000-4000-8000-000000000201',
    null,
    null
  ),
  (
    '30000000-0000-4000-8000-000000000205',
    '10000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000205',
    'manager',
    '00000000-0000-4000-8000-000000000201',
    current_timestamp,
    '00000000-0000-4000-8000-000000000201'
  );

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000201',
  true
);

select lives_ok(
  $$
    insert into public.project_documents (
      id,
      project_id,
      name,
      category,
      original_filename,
      mime_type,
      file_extension,
      file_size_bytes,
      object_path
    )
    values (
      '20000000-0000-4000-8000-000000000201',
      '10000000-0000-4000-8000-000000000201',
      'Site plan',
      'drawing',
      'site-plan.pdf',
      'application/pdf',
      'pdf',
      2048,
      'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000201/file.pdf'
    )
  $$,
  'owner can insert a document'
);

select is(
  (
    select uploaded_by
    from public.project_documents
    where id = '20000000-0000-4000-8000-000000000201'
  ),
  '00000000-0000-4000-8000-000000000201'::uuid,
  'the uploader is derived from auth.uid'
);

select is(
  (
    select uploaded_by_display_name
    from public.project_documents
    where id = '20000000-0000-4000-8000-000000000201'
  ),
  'Document Owner',
  'the uploader display name is captured from the profile'
);

select throws_ok(
  $$
    insert into public.project_documents (
      id,
      project_id,
      uploaded_by,
      name,
      category,
      original_filename,
      mime_type,
      file_extension,
      file_size_bytes,
      object_path
    )
    values (
      '20000000-0000-4000-8000-000000000209',
      '10000000-0000-4000-8000-000000000201',
      '00000000-0000-4000-8000-000000000207',
      'Forged',
      'other',
      'forged.pdf',
      'application/pdf',
      'pdf',
      100,
      'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000209/file.pdf'
    )
  $$,
  '42501',
  null,
  'clients cannot assign uploader identity'
);

select throws_ok(
  $$
    insert into public.project_documents (
      id, project_id, name, category, original_filename, mime_type,
      file_extension, file_size_bytes, object_path
    ) values (
      '20000000-0000-4000-8000-000000000210',
      '10000000-0000-4000-8000-000000000201',
      'Wrong path', 'other', 'wrong.pdf', 'application/pdf',
      'pdf', 100, 'projects/wrong/documents/wrong/file.pdf'
    )
  $$,
  '23514',
  null,
  'database rejects a noncanonical object path'
);

select throws_ok(
  $$
    insert into public.project_documents (
      id, project_id, name, category, original_filename, mime_type,
      file_extension, file_size_bytes, object_path
    ) values (
      '20000000-0000-4000-8000-000000000211',
      '10000000-0000-4000-8000-000000000201',
      'Wrong type', 'other', 'wrong.png', 'image/png',
      'pdf', 100,
      'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000211/file.pdf'
    )
  $$,
  '23514',
  null,
  'database rejects MIME and extension mismatches'
);

select throws_ok(
  $$
    insert into public.project_documents (
      id, project_id, name, category, original_filename, mime_type,
      file_extension, file_size_bytes, object_path
    ) values (
      '20000000-0000-4000-8000-000000000212',
      '10000000-0000-4000-8000-000000000201',
      'Too large', 'other', 'large.pdf', 'application/pdf',
      'pdf', 26214401,
      'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000212/file.pdf'
    )
  $$,
  '23514',
  null,
  'database rejects documents over 25 MiB'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000202',
  true
);

select is(
  (select count(*) from public.project_documents)::bigint,
  1::bigint,
  'manager can read active project documents'
);

select lives_ok(
  $$
    update public.project_documents
    set name = 'Manager revision', category = 'specification'
    where id = '20000000-0000-4000-8000-000000000201'
  $$,
  'manager can edit document metadata'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000203',
  true
);

select is(
  (select count(*) from public.project_documents)::bigint,
  1::bigint,
  'contributor can read active project documents'
);

select throws_ok(
  $$
    insert into public.project_documents (
      id, project_id, name, category, original_filename, mime_type,
      file_extension, file_size_bytes, object_path
    ) values (
      '20000000-0000-4000-8000-000000000213',
      '10000000-0000-4000-8000-000000000201',
      'Contributor upload', 'other', 'contributor.pdf', 'application/pdf',
      'pdf', 100,
      'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000213/file.pdf'
    )
  $$,
  '42501',
  null,
  'contributor cannot insert documents'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000204',
  true
);

select is(
  (select count(*) from public.project_documents)::bigint,
  1::bigint,
  'viewer can read active project documents'
);

select results_eq(
  $$
    with updated as (
      update public.project_documents
      set name = 'Viewer edit'
      where id = '20000000-0000-4000-8000-000000000201'
      returning 1
    )
    select count(*)::integer from updated
  $$,
  $$ values (0) $$,
  'viewer cannot edit document metadata'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000206',
  true
);

select is(
  (select count(*) from public.project_documents)::bigint,
  0::bigint,
  'project outsider cannot read documents'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000205',
  true
);

select is(
  (select count(*) from public.project_documents)::bigint,
  0::bigint,
  'removed member cannot read documents'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000207',
  true
);

select is(
  (select count(*) from public.project_documents)::bigint,
  1::bigint,
  'global admin can read documents'
);

select lives_ok(
  $$
    update public.project_documents
    set name = 'Admin review'
    where id = '20000000-0000-4000-8000-000000000201'
  $$,
  'global admin can edit document metadata'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000201',
  true
);

select throws_ok(
  $$
    insert into public.project_documents (
      id, project_id, name, category, original_filename, mime_type,
      file_extension, file_size_bytes, object_path
    ) values (
      '20000000-0000-4000-8000-000000000214',
      '10000000-0000-4000-8000-000000000202',
      'Archived upload', 'other', 'archived.pdf', 'application/pdf',
      'pdf', 100,
      'projects/10000000-0000-4000-8000-000000000202/documents/20000000-0000-4000-8000-000000000214/file.pdf'
    )
  $$,
  '42501',
  null,
  'documents cannot be added to archived projects'
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'project-documents',
      'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000201/file.pdf',
      '00000000-0000-4000-8000-000000000201',
      '{"mimetype":"application/pdf","size":2048}'::jsonb
    )
  $$,
  'owner can upload an immutable document object'
);

select set_config('storage.operation', 'storage.object.sign', true);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-documents'
      and name = 'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000201/file.pdf'
  ),
  1,
  'signed access can read an object with a matching active document row'
);

select set_config('storage.operation', 'storage.object.list', true);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-documents'
  ),
  0,
  'bucket listing is explicitly denied'
);

select set_config('storage.operation', '', true);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000203',
  true
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'project-documents',
      'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000299/file.pdf',
      '00000000-0000-4000-8000-000000000203',
      '{"mimetype":"application/pdf","size":100}'::jsonb
    )
  $$,
  '42501',
  null,
  'read-only participants cannot upload document objects'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000201',
  true
);

select lives_ok(
  $$
    update public.project_documents
    set deleted_at = current_timestamp
    where id = '20000000-0000-4000-8000-000000000201'
  $$,
  'owner can soft-delete an active document'
);

select is(
  (
    select count(*)::integer
    from public.project_documents
    where id = '20000000-0000-4000-8000-000000000201'
      and deleted_at is null
  ),
  0,
  'product reads exclude soft-deleted documents'
);

select set_config('storage.operation', 'storage.object.sign', true);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-documents'
      and name = 'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000201/file.pdf'
  ),
  0,
  'soft-deleted document objects cannot receive signed read access'
);

select set_config('storage.operation', '', true);

select lives_ok(
  $$
    delete from storage.objects
    where bucket_id = 'project-documents'
      and name = 'projects/10000000-0000-4000-8000-000000000201/documents/20000000-0000-4000-8000-000000000201/file.pdf'
  $$,
  'owner can clean up Storage after soft deletion'
);

select throws_ok(
  $$
    delete from public.project_documents
    where id = '20000000-0000-4000-8000-000000000201'
  $$,
  '42501',
  null,
  'authenticated users cannot physically delete document rows'
);

select throws_ok(
  $$
    update public.project_documents
    set project_id = '10000000-0000-4000-8000-000000000202'
    where id = '20000000-0000-4000-8000-000000000201'
  $$,
  '42501',
  null,
  'clients cannot change immutable document ownership or file fields'
);

select * from finish();
rollback;
