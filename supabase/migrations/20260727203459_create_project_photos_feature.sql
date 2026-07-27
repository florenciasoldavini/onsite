create type public.project_photo_kind as enum (
  'general',
  'progress',
  'issue',
  'safety',
  'quality',
  'delivery',
  'milestone'
);

create type public.project_photo_location_source as enum (
  'photo_exif'
);

create table public.project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  owner_id uuid not null references public.users(id) on delete restrict,
  uploaded_by uuid not null references public.users(id) on delete restrict,
  full_path text not null unique,
  thumbnail_path text not null unique,
  kind public.project_photo_kind not null default 'general',
  caption text check (caption is null or char_length(caption) <= 1000),
  is_marketing boolean not null default false,
  captured_at timestamptz(3) not null default current_timestamp,
  latitude double precision check (
    latitude is null or latitude between -90 and 90
  ),
  longitude double precision check (
    longitude is null or longitude between -180 and 180
  ),
  location_accuracy_meters double precision check (
    location_accuracy_meters is null or location_accuracy_meters > 0
  ),
  location_source public.project_photo_location_source,
  mime_type text not null default 'image/jpeg'
    check (mime_type = 'image/jpeg'),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  file_size_bytes bigint not null
    check (file_size_bytes > 0 and file_size_bytes <= 6291456),
  created_at timestamptz(3) not null default current_timestamp,
  updated_at timestamptz(3),
  deleted_at timestamptz(3),
  constraint project_photos_location_bundle_check check (
    (
      latitude is null
      and longitude is null
      and location_accuracy_meters is null
      and location_source is null
    )
    or (
      latitude is not null
      and longitude is not null
      and location_source is not null
    )
  ),
  constraint project_photos_full_path_check check (
    full_path = (
      'projects/' || project_id::text || '/photos/' || id::text || '/full.jpg'
    )
  ),
  constraint project_photos_thumbnail_path_check check (
    thumbnail_path = (
      'projects/' || project_id::text || '/photos/' || id::text || '/thumbnail.jpg'
    )
  )
);

create index project_photos_project_id_idx
on public.project_photos(project_id);

create index project_photos_owner_id_idx
on public.project_photos(owner_id);

create index project_photos_uploaded_by_idx
on public.project_photos(uploaded_by);

create index project_photos_active_project_captured_idx
on public.project_photos(project_id, captured_at desc, id desc)
where deleted_at is null;

create index project_photos_active_project_kind_captured_idx
on public.project_photos(project_id, kind, captured_at desc, id desc)
where deleted_at is null;

create index project_photos_active_project_marketing_captured_idx
on public.project_photos(project_id, is_marketing, captured_at desc, id desc)
where deleted_at is null;

create or replace function public.set_project_photo_derived_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  project_owner_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.project_id := old.project_id;
    new.owner_id := old.owner_id;
    new.uploaded_by := old.uploaded_by;
    new.full_path := old.full_path;
    new.thumbnail_path := old.thumbnail_path;
    new.captured_at := old.captured_at;
    new.latitude := old.latitude;
    new.longitude := old.longitude;
    new.location_accuracy_meters := old.location_accuracy_meters;
    new.location_source := old.location_source;
    new.mime_type := old.mime_type;
    new.width := old.width;
    new.height := old.height;
    new.file_size_bytes := old.file_size_bytes;
    return new;
  end if;

  if current_user_id is null then
    raise exception 'Photo uploader is required.' using errcode = '23502';
  end if;

  select projects.owner_id
  into project_owner_id
  from public.projects
  where projects.id = new.project_id
    and projects.deleted_at is null;

  if project_owner_id is null then
    raise exception 'Photo project is unavailable.' using errcode = '23503';
  end if;

  new.owner_id := project_owner_id;
  new.uploaded_by := current_user_id;
  new.deleted_at := null;

  return new;
end;
$$;

revoke all on function public.set_project_photo_derived_fields()
from public, anon, authenticated;

create trigger project_photos_set_derived_fields
before insert or update
on public.project_photos
for each row
execute function public.set_project_photo_derived_fields();

grant select on table public.project_photos to authenticated;
grant insert (
  id,
  project_id,
  full_path,
  thumbnail_path,
  kind,
  caption,
  is_marketing,
  captured_at,
  latitude,
  longitude,
  location_accuracy_meters,
  location_source,
  mime_type,
  width,
  height,
  file_size_bytes
) on table public.project_photos to authenticated;
grant update (
  kind,
  caption,
  is_marketing,
  updated_at,
  deleted_at
) on table public.project_photos to authenticated;

alter table public.project_photos enable row level security;

create policy "project_photos_select_owner_or_admin"
on public.project_photos
for select
to authenticated
using (
  (select auth.uid()) is not null
  and deleted_at is null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
);

create policy "project_photos_insert_owner_or_admin"
on public.project_photos
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and deleted_at is null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
  and (select public.can_current_user_access_project(project_id::text))
);

create policy "project_photos_update_owner_or_admin"
on public.project_photos
for update
to authenticated
using (
  (select auth.uid()) is not null
  and deleted_at is null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
)
with check (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'project-photos',
  'project-photos',
  false,
  6291456,
  array['image/jpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project_photos_objects_select_owner_or_admin"
on storage.objects;
drop policy if exists "project_photos_objects_insert_owner_or_admin"
on storage.objects;
drop policy if exists "project_photos_objects_delete_owner_or_admin"
on storage.objects;

create policy "project_photos_objects_select_owner_or_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-photos'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'photos'
  and (storage.foldername(name))[4] is not null
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('full.jpg', 'thumbnail.jpg')
  and (select public.can_current_user_access_project(
    (storage.foldername(name))[2]
  ))
  and exists (
    select 1
    from public.project_photos
    where project_photos.deleted_at is null
      and (
        project_photos.full_path = name
        or project_photos.thumbnail_path = name
      )
  )
);

create policy "project_photos_objects_insert_owner_or_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-photos'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'photos'
  and (storage.foldername(name))[4] is not null
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('full.jpg', 'thumbnail.jpg')
  and (select public.can_current_user_access_project(
    (storage.foldername(name))[2]
  ))
);

create policy "project_photos_objects_delete_owner_or_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-photos'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'photos'
  and (storage.foldername(name))[4] is not null
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('full.jpg', 'thumbnail.jpg')
  and (select public.can_current_user_access_project(
    (storage.foldername(name))[2]
  ))
);
