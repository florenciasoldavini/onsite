-- Simple project documents with one immutable private file per record.

create type public.project_document_category as enum (
  'drawing',
  'specification',
  'permit',
  'contract',
  'manual',
  'report',
  'invoice',
  'other'
);

create table public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  uploaded_by uuid not null references public.users(id) on delete restrict,
  uploaded_by_display_name text not null check (
    uploaded_by_display_name = trim(uploaded_by_display_name)
    and char_length(uploaded_by_display_name) between 1 and 160
  ),
  name text not null check (
    name = trim(name)
    and char_length(name) between 1 and 160
  ),
  category public.project_document_category not null,
  original_filename text not null check (
    original_filename = trim(original_filename)
    and char_length(original_filename) between 1 and 255
  ),
  mime_type text not null check (
    mime_type in ('application/pdf', 'image/jpeg', 'image/png')
  ),
  file_extension text not null check (
    file_extension in ('pdf', 'jpg', 'png')
  ),
  file_size_bytes bigint not null check (
    file_size_bytes > 0
    and file_size_bytes <= 26214400
  ),
  object_path text not null unique,
  created_at timestamptz(3) not null default current_timestamp,
  updated_at timestamptz(3),
  deleted_at timestamptz(3),
  constraint project_documents_mime_extension_check check (
    (mime_type = 'application/pdf' and file_extension = 'pdf')
    or (mime_type = 'image/jpeg' and file_extension = 'jpg')
    or (mime_type = 'image/png' and file_extension = 'png')
  ),
  constraint project_documents_object_path_check check (
    object_path = (
      'projects/' || project_id::text
      || '/documents/' || id::text
      || '/file.' || file_extension
    )
  )
);

create index project_documents_project_created_idx
on public.project_documents(project_id, created_at desc, id desc)
where deleted_at is null;

create index project_documents_project_category_created_idx
on public.project_documents(project_id, category, created_at desc, id desc)
where deleted_at is null;

create index project_documents_uploaded_by_idx
on public.project_documents(uploaded_by);

create or replace function public.set_project_document_derived_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.project_id := old.project_id;
    new.uploaded_by := old.uploaded_by;
    new.uploaded_by_display_name := old.uploaded_by_display_name;
    new.original_filename := old.original_filename;
    new.mime_type := old.mime_type;
    new.file_extension := old.file_extension;
    new.file_size_bytes := old.file_size_bytes;
    new.object_path := old.object_path;
    new.created_at := old.created_at;
    return new;
  end if;

  if actor_id is null then
    raise exception 'Document uploader is required.' using errcode = '23502';
  end if;

  new.uploaded_by := actor_id;
  select trim(concat_ws(' ', users.first_name, users.last_name))
  into new.uploaded_by_display_name
  from public.users
  where users.id = actor_id
    and users.deleted_at is null;

  if new.uploaded_by_display_name is null
    or new.uploaded_by_display_name = ''
  then
    raise exception 'Document uploader profile is unavailable.'
      using errcode = '23503';
  end if;

  new.deleted_at := null;
  return new;
end;
$$;

revoke all on function public.set_project_document_derived_fields()
from public, anon, authenticated;

create trigger project_documents_set_derived_fields
before insert or update
on public.project_documents
for each row
execute function public.set_project_document_derived_fields();

revoke all on table public.project_documents from anon, authenticated;
grant select on table public.project_documents to authenticated;
grant insert (
  id,
  project_id,
  name,
  category,
  original_filename,
  mime_type,
  file_extension,
  file_size_bytes,
  object_path
) on table public.project_documents to authenticated;
grant update (
  name,
  category,
  updated_at,
  deleted_at
) on table public.project_documents to authenticated;

alter table public.project_documents enable row level security;

create policy "project_documents_select_by_capability"
on public.project_documents
for select
to authenticated
using (
  private.current_user_has_project_permission(project_id, 'project.read')
);

create policy "project_documents_insert_by_capability"
on public.project_documents
for insert
to authenticated
with check (
  deleted_at is null
  and uploaded_by = (select auth.uid())
  and private.current_user_has_project_permission(
    project_id,
    'project.documents.write'
  )
);

create policy "project_documents_update_by_capability"
on public.project_documents
for update
to authenticated
using (
  deleted_at is null
  and private.current_user_has_project_permission(
    project_id,
    'project.documents.write'
  )
)
with check (
  private.current_user_has_project_permission(
    project_id,
    'project.documents.write'
  )
);

insert into public.project_permissions (code, description)
values (
  'project.documents.write',
  'Upload, edit, and delete project documents.'
);

insert into public.project_role_permissions (role_code, permission_code)
values
  ('owner', 'project.documents.write'),
  ('manager', 'project.documents.write');

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'project-documents',
  'project-documents',
  false,
  26214400,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "project_documents_objects_select_by_capability"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-documents'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'documents'
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('file.pdf', 'file.jpg', 'file.png')
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.read'
  )
  and (
    (
      storage.allow_only_operation('storage.object.upload')
      and owner_id = (select auth.uid())::text
    )
    or (
      storage.allow_any_operation(array[
        'storage.object.get_authenticated',
        'storage.object.sign',
        'object.get_authenticated_info',
        'object.head_authenticated_info'
      ])
      and exists (
        select 1
        from public.project_documents document
        where document.deleted_at is null
          and document.object_path = name
      )
    )
  )
);

create policy "project_documents_objects_insert_by_capability"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-documents'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'documents'
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('file.pdf', 'file.jpg', 'file.png')
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.documents.write'
  )
);

create policy "project_documents_objects_delete_by_capability"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-documents'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'documents'
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('file.pdf', 'file.jpg', 'file.png')
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.documents.write'
  )
);
