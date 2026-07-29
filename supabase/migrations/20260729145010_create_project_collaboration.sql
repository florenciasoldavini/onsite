-- Centralized project collaboration roles, capabilities, invitations, and RLS.

create schema if not exists private;
revoke all on schema private from public, anon;

create table public.project_roles (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  display_name text not null check (char_length(trim(display_name)) between 2 and 60),
  description text not null check (char_length(trim(description)) between 2 and 240),
  is_assignable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz(3) not null default current_timestamp,
  updated_at timestamptz(3),
  retired_at timestamptz(3)
);

create table public.project_permissions (
  code text primary key check (code ~ '^project(\.[a-z][a-z0-9_]*)+$'),
  description text not null check (char_length(trim(description)) between 2 and 240),
  created_at timestamptz(3) not null default current_timestamp
);

create table public.project_role_permissions (
  role_code text not null references public.project_roles(code) on delete restrict,
  permission_code text not null references public.project_permissions(code) on delete restrict,
  created_at timestamptz(3) not null default current_timestamp,
  primary key (role_code, permission_code)
);

insert into public.project_roles (
  code,
  display_name,
  description,
  is_assignable,
  sort_order
)
values
  ('owner', 'Owner', 'Owns the project and manages access.', false, 0),
  ('manager', 'Manager', 'Manages project settings and operational work.', true, 10),
  ('contributor', 'Contributor', 'Adds and updates project tasks and photos.', true, 20),
  ('viewer', 'Viewer', 'Views project information without making changes.', true, 30);

insert into public.project_permissions (code, description)
values
  ('project.read', 'Read the project and its shared content.'),
  ('project.update', 'Update general project settings.'),
  ('project.change_client', 'Change the client linked to the project.'),
  ('project.delete', 'Archive the project.'),
  ('project.cover.write', 'Upload, replace, or remove the project cover.'),
  ('project.tasks.write', 'Create and update project tasks.'),
  ('project.photos.write', 'Create and update project photos.'),
  ('project.members.read', 'Read the project team and pending invitations.'),
  ('project.members.manage', 'Invite, change, revoke, or remove project members.');

insert into public.project_role_permissions (role_code, permission_code)
select 'owner', code from public.project_permissions;

insert into public.project_role_permissions (role_code, permission_code)
values
  ('manager', 'project.read'),
  ('manager', 'project.update'),
  ('manager', 'project.cover.write'),
  ('manager', 'project.tasks.write'),
  ('manager', 'project.photos.write'),
  ('manager', 'project.members.read'),
  ('contributor', 'project.read'),
  ('contributor', 'project.tasks.write'),
  ('contributor', 'project.photos.write'),
  ('contributor', 'project.members.read'),
  ('viewer', 'project.read'),
  ('viewer', 'project.members.read');

create type public.project_invitation_status as enum (
  'pending',
  'accepted',
  'declined',
  'revoked',
  'expired'
);

create type public.project_invitation_delivery_status as enum (
  'pending',
  'sent',
  'failed'
);

create table public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  invited_email text not null check (
    invited_email = lower(trim(invited_email))
    and char_length(invited_email) between 3 and 254
  ),
  role_code text not null references public.project_roles(code) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  status public.project_invitation_status not null default 'pending',
  delivery_status public.project_invitation_delivery_status not null default 'pending',
  delivery_version integer not null default 1 check (delivery_version > 0),
  invited_by uuid not null references public.users(id) on delete restrict,
  accepted_by uuid references public.users(id) on delete restrict,
  revoked_by uuid references public.users(id) on delete restrict,
  expires_at timestamptz(3) not null,
  last_sent_at timestamptz(3),
  responded_at timestamptz(3),
  created_at timestamptz(3) not null default current_timestamp,
  updated_at timestamptz(3),
  constraint project_invitations_assignable_role check (role_code <> 'owner'),
  constraint project_invitations_terminal_actor check (
    (status = 'accepted' and accepted_by is not null and responded_at is not null)
    or (status = 'revoked' and revoked_by is not null and responded_at is not null)
    or (status in ('declined', 'expired') and responded_at is not null)
    or status = 'pending'
  )
);

create unique index project_invitations_pending_email_idx
on public.project_invitations(project_id, invited_email)
where status = 'pending';

create index project_invitations_project_created_idx
on public.project_invitations(project_id, created_at desc, id);

create index project_invitations_email_pending_idx
on public.project_invitations(invited_email, expires_at, id)
where status = 'pending';

create index project_invitations_sender_created_idx
on public.project_invitations(invited_by, created_at desc);

create table public.project_memberships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict,
  role_code text not null references public.project_roles(code) on delete restrict,
  invitation_id uuid references public.project_invitations(id) on delete restrict,
  invited_by uuid not null references public.users(id) on delete restrict,
  joined_at timestamptz(3) not null default current_timestamp,
  updated_at timestamptz(3),
  removed_at timestamptz(3),
  removed_by uuid references public.users(id) on delete restrict,
  constraint project_memberships_assignable_role check (role_code <> 'owner'),
  constraint project_memberships_removal_bundle check (
    (removed_at is null and removed_by is null)
    or (removed_at is not null and removed_by is not null)
  )
);

create unique index project_memberships_active_user_idx
on public.project_memberships(project_id, user_id)
where removed_at is null;

create index project_memberships_user_project_idx
on public.project_memberships(user_id, project_id)
where removed_at is null;

create index project_memberships_project_joined_idx
on public.project_memberships(project_id, joined_at, id)
where removed_at is null;

create type public.project_collaboration_event_type as enum (
  'invited',
  'resent',
  'accepted',
  'declined',
  'revoked',
  'role_changed',
  'removed',
  'left',
  'project_archived'
);

create table public.project_collaboration_events (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete restrict,
  event_type public.project_collaboration_event_type not null,
  actor_id uuid references public.users(id) on delete restrict,
  subject_user_id uuid references public.users(id) on delete restrict,
  invitation_id uuid references public.project_invitations(id) on delete restrict,
  membership_id uuid references public.project_memberships(id) on delete restrict,
  previous_role_code text references public.project_roles(code) on delete restrict,
  next_role_code text references public.project_roles(code) on delete restrict,
  created_at timestamptz(3) not null default current_timestamp
);

create index project_collaboration_events_project_created_idx
on public.project_collaboration_events(project_id, created_at desc, id desc);

revoke all on table public.project_roles from anon, authenticated;
revoke all on table public.project_permissions from anon, authenticated;
revoke all on table public.project_role_permissions from anon, authenticated;
revoke all on table public.project_invitations from anon, authenticated;
revoke all on table public.project_memberships from anon, authenticated;
revoke all on table public.project_collaboration_events from anon, authenticated;

grant select on table public.project_roles to authenticated;
grant select on table public.project_permissions to authenticated;
grant select on table public.project_role_permissions to authenticated;
grant select on table public.project_roles to service_role;
grant select on table public.project_invitations to service_role;

alter table public.project_roles enable row level security;
alter table public.project_permissions enable row level security;
alter table public.project_role_permissions enable row level security;
alter table public.project_invitations enable row level security;
alter table public.project_memberships enable row level security;
alter table public.project_collaboration_events enable row level security;

create policy "project_roles_read_active"
on public.project_roles for select to authenticated
using (retired_at is null);

create policy "project_permissions_read"
on public.project_permissions for select to authenticated
using (true);

create policy "project_role_permissions_read"
on public.project_role_permissions for select to authenticated
using (true);

create or replace function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'admin'
      and deleted_at is null
  );
$$;

create or replace function private.current_user_project_role(p_project_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p.owner_id = (select auth.uid()) then 'owner'
    else (
      select pm.role_code
      from public.project_memberships pm
      join public.project_roles pr on pr.code = pm.role_code
      where pm.project_id = p.id
        and pm.user_id = (select auth.uid())
        and pm.removed_at is null
        and pr.retired_at is null
      limit 1
    )
  end
  from public.projects p
  where p.id = p_project_id
    and p.deleted_at is null;
$$;

create or replace function private.current_user_has_project_permission(
  p_project_id uuid,
  p_permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.deleted_at is null
      and (
        (select private.current_user_is_admin())
        or exists (
          select 1
          from public.project_role_permissions prp
          join public.project_roles pr on pr.code = prp.role_code
          where prp.role_code = (
            select private.current_user_project_role(p_project_id)
          )
            and prp.permission_code = p_permission_code
            and pr.retired_at is null
        )
      )
  );
$$;

revoke all on function private.current_user_is_admin() from public, anon;
revoke all on function private.current_user_project_role(uuid) from public, anon;
revoke all on function private.current_user_has_project_permission(uuid, text)
from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_user_is_admin() to authenticated;
grant execute on function private.current_user_project_role(uuid) to authenticated;
grant execute on function private.current_user_has_project_permission(uuid, text)
to authenticated;

create or replace function public.get_project_access(p_project_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with effective as (
    select
      private.current_user_project_role(p_project_id) as role_code,
      private.current_user_is_admin() as is_admin,
      exists (
        select 1
        from public.projects
        where id = p_project_id
          and deleted_at is null
      ) as project_is_active
  )
  select case
    when not project_is_active or (role_code is null and not is_admin) then null
    else jsonb_build_object(
      'project_id', p_project_id,
      'role', case when is_admin then coalesce(role_code, 'admin') else role_code end,
      'is_owner', role_code = 'owner',
      'is_admin', is_admin,
      'permissions', (
        select coalesce(jsonb_agg(pp.code order by pp.code), '[]'::jsonb)
        from public.project_permissions pp
        where is_admin
          or exists (
            select 1
            from public.project_role_permissions prp
            join public.project_roles pr on pr.code = prp.role_code
            where prp.role_code = effective.role_code
              and prp.permission_code = pp.code
              and pr.retired_at is null
          )
      )
    )
  end
  from effective;
$$;

revoke all on function public.get_project_access(uuid) from public, anon;
grant execute on function public.get_project_access(uuid) to authenticated;

create or replace function public.can_current_user_access_project(project_id_text text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when project_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then private.current_user_has_project_permission(
        project_id_text::uuid,
        'project.read'
      )
    else false
  end;
$$;

drop policy if exists "projects_select_owner_or_admin" on public.projects;
drop policy if exists "projects_update_owner_or_admin" on public.projects;

create policy "projects_select_by_capability"
on public.projects for select to authenticated
using (private.current_user_has_project_permission(id, 'project.read'));

create policy "projects_update_by_capability"
on public.projects for update to authenticated
using (
  private.current_user_has_project_permission(id, 'project.update')
  or private.current_user_has_project_permission(id, 'project.change_client')
  or private.current_user_has_project_permission(id, 'project.delete')
  or private.current_user_has_project_permission(id, 'project.cover.write')
)
with check (
  true
);

create or replace function private.enforce_project_protected_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Project ownership cannot be changed.'
      using errcode = '42501';
  end if;

  if (
    to_jsonb(new) - array[
      'id',
      'owner_id',
      'client_id',
      'cover_image_path',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  ) is distinct from (
    to_jsonb(old) - array[
      'id',
      'owner_id',
      'client_id',
      'cover_image_path',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  )
    and not private.current_user_has_project_permission(
      old.id,
      'project.update'
    )
  then
    raise exception 'You cannot update this project.'
      using errcode = '42501';
  end if;

  if new.cover_image_path is distinct from old.cover_image_path
    and not private.current_user_has_project_permission(
      old.id,
      'project.cover.write'
    )
  then
    raise exception 'You cannot change this project cover.'
      using errcode = '42501';
  end if;

  if new.client_id is distinct from old.client_id
    and not private.current_user_has_project_permission(
      old.id,
      'project.change_client'
    )
  then
    raise exception 'You cannot change this project client.'
      using errcode = '42501';
  end if;

  if new.deleted_at is distinct from old.deleted_at
    and not private.current_user_has_project_permission(
      old.id,
      'project.delete'
    )
  then
    raise exception 'You cannot archive this project.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_project_protected_updates()
from public, anon, authenticated;

create trigger projects_enforce_collaboration_updates
before update
on public.projects
for each row
execute function private.enforce_project_protected_updates();

drop policy if exists "clients_select_owner_or_admin" on public.clients;
create policy "clients_select_owner_admin_or_project_participant"
on public.clients for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
    or exists (
      select 1
      from public.projects p
      where p.client_id = clients.id
        and p.deleted_at is null
        and private.current_user_has_project_permission(p.id, 'project.read')
    )
  )
);

drop policy if exists "tasks_select_owner_or_admin" on public.tasks;
drop policy if exists "tasks_insert_owner_or_admin" on public.tasks;
drop policy if exists "tasks_update_owner_or_admin" on public.tasks;

create policy "tasks_select_by_project_capability"
on public.tasks for select to authenticated
using (
  (
    project_id is null
    and (
      owner_id = (select auth.uid())
      or (select public.is_current_user_admin())
    )
  )
  or (
    project_id is not null
    and private.current_user_has_project_permission(project_id, 'project.read')
  )
);

create policy "tasks_insert_by_project_capability"
on public.tasks for insert to authenticated
with check (
  (
    project_id is null
    and owner_id = (select auth.uid())
  )
  or (
    project_id is not null
    and private.current_user_has_project_permission(
      project_id,
      'project.tasks.write'
    )
  )
);

create policy "tasks_update_by_project_capability"
on public.tasks for update to authenticated
using (
  (
    project_id is null
    and (
      owner_id = (select auth.uid())
      or (select public.is_current_user_admin())
    )
  )
  or (
    project_id is not null
    and private.current_user_has_project_permission(
      project_id,
      'project.tasks.write'
    )
  )
)
with check (
  (
    project_id is null
    and (
      owner_id = (select auth.uid())
      or (select public.is_current_user_admin())
    )
  )
  or (
    project_id is not null
    and private.current_user_has_project_permission(
      project_id,
      'project.tasks.write'
    )
  )
);

drop policy if exists "project_photos_select_owner_or_admin"
on public.project_photos;
drop policy if exists "project_photos_insert_owner_or_admin"
on public.project_photos;
drop policy if exists "project_photos_update_owner_or_admin"
on public.project_photos;

create policy "project_photos_select_by_capability"
on public.project_photos for select to authenticated
using (
  private.current_user_has_project_permission(project_id, 'project.read')
);

create policy "project_photos_insert_by_capability"
on public.project_photos for insert to authenticated
with check (
  deleted_at is null
  and private.current_user_has_project_permission(
    project_id,
    'project.photos.write'
  )
);

create policy "project_photos_update_by_capability"
on public.project_photos for update to authenticated
using (
  deleted_at is null
  and private.current_user_has_project_permission(
    project_id,
    'project.photos.write'
  )
)
with check (
  private.current_user_has_project_permission(
    project_id,
    'project.photos.write'
  )
);

drop policy if exists "project_covers_select_owner_or_admin"
on storage.objects;
drop policy if exists "project_covers_insert_owner_or_admin"
on storage.objects;
drop policy if exists "project_covers_update_owner_or_admin"
on storage.objects;
drop policy if exists "project_covers_delete_owner_or_admin"
on storage.objects;

create policy "project_covers_select_by_capability"
on storage.objects for select to authenticated
using (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'cover'
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.read'
  )
);

create policy "project_covers_insert_by_capability"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'cover'
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.cover.write'
  )
);

create policy "project_covers_update_by_capability"
on storage.objects for update to authenticated
using (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'cover'
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.cover.write'
  )
)
with check (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'cover'
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.cover.write'
  )
);

create policy "project_covers_delete_by_capability"
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'cover'
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.cover.write'
  )
);

drop policy if exists "project_photos_objects_select_owner_or_admin"
on storage.objects;
drop policy if exists "project_photos_objects_insert_owner_or_admin"
on storage.objects;
drop policy if exists "project_photos_objects_delete_owner_or_admin"
on storage.objects;

create policy "project_photos_objects_select_by_capability"
on storage.objects for select to authenticated
using (
  bucket_id = 'project-photos'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'photos'
  and (storage.foldername(name))[4] is not null
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('full.jpg', 'thumbnail.jpg')
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.read'
  )
  and (
    (
      storage.allow_only_operation('storage.object.upload')
      and owner_id = (select auth.uid())::text
    )
    or exists (
      select 1
      from public.project_photos pp
      where pp.deleted_at is null
        and (pp.full_path = name or pp.thumbnail_path = name)
    )
  )
);

create policy "project_photos_objects_insert_by_capability"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-photos'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'photos'
  and (storage.foldername(name))[4] is not null
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('full.jpg', 'thumbnail.jpg')
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.photos.write'
  )
);

create policy "project_photos_objects_delete_by_capability"
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-photos'
  and (storage.foldername(name))[1] = 'projects'
  and (storage.foldername(name))[3] = 'photos'
  and (storage.foldername(name))[4] is not null
  and array_length(storage.foldername(name), 1) = 4
  and storage.filename(name) in ('full.jpg', 'thumbnail.jpg')
  and private.current_user_has_project_permission(
    (storage.foldername(name))[2]::uuid,
    'project.photos.write'
  )
);

create or replace function private.assert_assignable_project_role(
  p_role_code text
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.project_roles
    where code = p_role_code
      and is_assignable
      and retired_at is null
  ) then
    raise exception 'The selected project role is unavailable.'
      using errcode = '22023';
  end if;
end;
$$;

create or replace function private.create_project_invitation(
  p_project_id uuid,
  p_email text,
  p_role_code text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns public.project_invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  normalized_email text := lower(trim(p_email));
  result public.project_invitations;
begin
  if actor_id is null or not private.current_user_has_project_permission(
    p_project_id,
    'project.members.manage'
  ) then
    raise exception 'You cannot invite members to this project.'
      using errcode = '42501';
  end if;

  perform private.assert_assignable_project_role(p_role_code);

  if p_expires_at <= current_timestamp
    or p_expires_at > current_timestamp + interval '7 days 5 minutes'
  then
    raise exception 'The invitation expiry is invalid.' using errcode = '22023';
  end if;

  update public.project_invitations
  set
    status = 'expired',
    responded_at = current_timestamp,
    updated_at = current_timestamp
  where project_id = p_project_id
    and invited_email = normalized_email
    and status = 'pending'
    and expires_at <= current_timestamp;

  if exists (
    select 1
    from public.project_memberships pm
    join public.users u on u.id = pm.user_id
    where pm.project_id = p_project_id
      and pm.removed_at is null
      and u.email = normalized_email
      and u.deleted_at is null
  ) then
    raise exception 'This person is already a project member.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.projects p
    join public.users u on u.id = p.owner_id
    where p.id = p_project_id
      and u.email = normalized_email
  ) then
    raise exception 'The project owner is already part of this project.'
      using errcode = '23505';
  end if;

  if (
    select count(*)
    from public.project_collaboration_events events
    where events.actor_id = (select auth.uid())
      and event_type in ('invited', 'resent')
      and created_at > current_timestamp - interval '24 hours'
  ) >= 20 then
    raise exception 'The daily invitation email limit has been reached.'
      using errcode = 'P0001';
  end if;

  insert into public.project_invitations (
    project_id,
    invited_email,
    role_code,
    token_hash,
    invited_by,
    expires_at
  )
  values (
    p_project_id,
    normalized_email,
    p_role_code,
    p_token_hash,
    actor_id,
    p_expires_at
  )
  returning * into result;

  insert into public.project_collaboration_events (
    project_id,
    event_type,
    actor_id,
    invitation_id,
    next_role_code
  )
  values (
    p_project_id,
    'invited',
    actor_id,
    result.id,
    p_role_code
  );

  return result;
end;
$$;

create or replace function private.resend_project_invitation(
  p_invitation_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns public.project_invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  invitation public.project_invitations;
begin
  if p_expires_at <= current_timestamp
    or p_expires_at > current_timestamp + interval '7 days 5 minutes'
  then
    raise exception 'The invitation expiry is invalid.' using errcode = '22023';
  end if;

  select * into invitation
  from public.project_invitations
  where id = p_invitation_id
  for update;

  if invitation.id is null
    or not private.current_user_has_project_permission(
      invitation.project_id,
      'project.members.manage'
    )
  then
    raise exception 'This invitation is unavailable.' using errcode = '42501';
  end if;

  if invitation.status <> 'pending' then
    raise exception 'Only pending invitations can be resent.'
      using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.project_collaboration_events events
    where events.actor_id = (select auth.uid())
      and event_type in ('invited', 'resent')
      and created_at > current_timestamp - interval '24 hours'
  ) >= 20 then
    raise exception 'The daily invitation email limit has been reached.'
      using errcode = 'P0001';
  end if;

  if invitation.last_sent_at is not null
    and invitation.last_sent_at > current_timestamp - interval '60 seconds'
  then
    raise exception 'Wait before resending this invitation.'
      using errcode = 'P0001';
  end if;

  update public.project_invitations
  set
    token_hash = p_token_hash,
    expires_at = p_expires_at,
    delivery_status = 'pending',
    delivery_version = delivery_version + 1,
    updated_at = current_timestamp
  where id = invitation.id
  returning * into invitation;

  insert into public.project_collaboration_events (
    project_id,
    event_type,
    actor_id,
    invitation_id,
    next_role_code
  )
  values (
    invitation.project_id,
    'resent',
    actor_id,
    invitation.id,
    invitation.role_code
  );

  return invitation;
end;
$$;

create or replace function private.respond_project_invitation(
  p_invitation_id uuid,
  p_response text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  invitation public.project_invitations;
  membership public.project_memberships;
begin
  if p_response not in ('accepted', 'declined') then
    raise exception 'The invitation response is invalid.' using errcode = '22023';
  end if;

  select * into invitation
  from public.project_invitations
  where id = p_invitation_id
  for update;

  if invitation.id is null
    or actor_id is null
    or actor_email = ''
    or actor_email <> invitation.invited_email
  then
    raise exception 'This invitation is unavailable.' using errcode = '42501';
  end if;

  if invitation.status = 'accepted'
    and invitation.accepted_by = actor_id
    and p_response = 'accepted'
  then
    select * into membership
    from public.project_memberships
    where invitation_id = invitation.id
      and user_id = actor_id
      and removed_at is null;

    return jsonb_build_object(
      'invitation_id', invitation.id,
      'membership_id', membership.id,
      'status', 'accepted'
    );
  end if;

  if invitation.status <> 'pending' then
    raise exception 'This invitation has already been resolved.'
      using errcode = '22023';
  end if;

  if invitation.expires_at <= current_timestamp then
    update public.project_invitations
    set
      status = 'expired',
      responded_at = current_timestamp,
      updated_at = current_timestamp
    where id = invitation.id;

    return jsonb_build_object(
      'invitation_id', invitation.id,
      'status', 'expired'
    );
  end if;

  if p_response = 'declined' then
    update public.project_invitations
    set
      status = 'declined',
      responded_at = current_timestamp,
      updated_at = current_timestamp
    where id = invitation.id;

    insert into public.project_collaboration_events (
      project_id,
      event_type,
      actor_id,
      subject_user_id,
      invitation_id,
      next_role_code
    )
    values (
      invitation.project_id,
      'declined',
      actor_id,
      actor_id,
      invitation.id,
      invitation.role_code
    );

    return jsonb_build_object(
      'invitation_id', invitation.id,
      'status', 'declined'
    );
  end if;

  perform private.assert_assignable_project_role(invitation.role_code);

  insert into public.project_memberships (
    project_id,
    user_id,
    role_code,
    invitation_id,
    invited_by
  )
  values (
    invitation.project_id,
    actor_id,
    invitation.role_code,
    invitation.id,
    invitation.invited_by
  )
  returning * into membership;

  update public.project_invitations
  set
    status = 'accepted',
    accepted_by = actor_id,
    responded_at = current_timestamp,
    updated_at = current_timestamp
  where id = invitation.id;

  insert into public.project_collaboration_events (
    project_id,
    event_type,
    actor_id,
    subject_user_id,
    invitation_id,
    membership_id,
    next_role_code
  )
  values (
    invitation.project_id,
    'accepted',
    actor_id,
    actor_id,
    invitation.id,
    membership.id,
    invitation.role_code
  );

  return jsonb_build_object(
    'invitation_id', invitation.id,
    'membership_id', membership.id,
    'project_id', invitation.project_id,
    'status', 'accepted'
  );
end;
$$;

create or replace function private.revoke_project_invitation(
  p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  invitation public.project_invitations;
begin
  select * into invitation
  from public.project_invitations
  where id = p_invitation_id
  for update;

  if invitation.id is null
    or not private.current_user_has_project_permission(
      invitation.project_id,
      'project.members.manage'
    )
  then
    raise exception 'This invitation is unavailable.' using errcode = '42501';
  end if;

  if invitation.status <> 'pending' then
    raise exception 'Only pending invitations can be revoked.'
      using errcode = '22023';
  end if;

  update public.project_invitations
  set
    status = 'revoked',
    revoked_by = actor_id,
    responded_at = current_timestamp,
    updated_at = current_timestamp
  where id = invitation.id;

  insert into public.project_collaboration_events (
    project_id,
    event_type,
    actor_id,
    invitation_id,
    previous_role_code
  )
  values (
    invitation.project_id,
    'revoked',
    actor_id,
    invitation.id,
    invitation.role_code
  );
end;
$$;

create or replace function private.set_project_invitation_delivery(
  p_invitation_id uuid,
  p_delivery_version integer,
  p_delivery_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.project_invitations;
begin
  if p_delivery_status not in ('sent', 'failed') then
    raise exception 'The invitation delivery status is invalid.'
      using errcode = '22023';
  end if;

  select * into invitation
  from public.project_invitations
  where id = p_invitation_id
  for update;

  if invitation.id is null
    or not private.current_user_has_project_permission(
      invitation.project_id,
      'project.members.manage'
    )
  then
    raise exception 'This invitation is unavailable.' using errcode = '42501';
  end if;

  if invitation.delivery_version <> p_delivery_version then
    return;
  end if;

  update public.project_invitations
  set
    delivery_status = p_delivery_status::public.project_invitation_delivery_status,
    last_sent_at = current_timestamp,
    updated_at = current_timestamp
  where id = invitation.id;
end;
$$;

create or replace function private.update_project_member_role(
  p_membership_id uuid,
  p_role_code text
)
returns public.project_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  membership public.project_memberships;
  previous_role text;
begin
  select * into membership
  from public.project_memberships
  where id = p_membership_id
    and removed_at is null
  for update;

  if membership.id is null
    or not private.current_user_has_project_permission(
      membership.project_id,
      'project.members.manage'
    )
  then
    raise exception 'This project member is unavailable.' using errcode = '42501';
  end if;

  perform private.assert_assignable_project_role(p_role_code);
  previous_role := membership.role_code;

  update public.project_memberships
  set role_code = p_role_code, updated_at = current_timestamp
  where id = membership.id
  returning * into membership;

  if previous_role is distinct from p_role_code then
    insert into public.project_collaboration_events (
      project_id,
      event_type,
      actor_id,
      subject_user_id,
      membership_id,
      previous_role_code,
      next_role_code
    )
    values (
      membership.project_id,
      'role_changed',
      actor_id,
      membership.user_id,
      membership.id,
      previous_role,
      p_role_code
    );
  end if;

  return membership;
end;
$$;

create or replace function private.remove_project_member(
  p_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  membership public.project_memberships;
begin
  select * into membership
  from public.project_memberships
  where id = p_membership_id
    and removed_at is null
  for update;

  if membership.id is null
    or not private.current_user_has_project_permission(
      membership.project_id,
      'project.members.manage'
    )
  then
    raise exception 'This project member is unavailable.' using errcode = '42501';
  end if;

  update public.project_memberships
  set
    removed_at = current_timestamp,
    removed_by = actor_id,
    updated_at = current_timestamp
  where id = membership.id;

  insert into public.project_collaboration_events (
    project_id,
    event_type,
    actor_id,
    subject_user_id,
    membership_id,
    previous_role_code
  )
  values (
    membership.project_id,
    'removed',
    actor_id,
    membership.user_id,
    membership.id,
    membership.role_code
  );
end;
$$;

create or replace function private.leave_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  membership public.project_memberships;
begin
  select * into membership
  from public.project_memberships
  where project_id = p_project_id
    and user_id = actor_id
    and removed_at is null
  for update;

  if membership.id is null then
    raise exception 'You are not an active member of this project.'
      using errcode = '42501';
  end if;

  update public.project_memberships
  set
    removed_at = current_timestamp,
    removed_by = actor_id,
    updated_at = current_timestamp
  where id = membership.id;

  insert into public.project_collaboration_events (
    project_id,
    event_type,
    actor_id,
    subject_user_id,
    membership_id,
    previous_role_code
  )
  values (
    p_project_id,
    'left',
    actor_id,
    actor_id,
    membership.id,
    membership.role_code
  );
end;
$$;

create or replace function private.list_project_members(
  p_project_id uuid,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with paging as (
    select
      greatest(1, least(coalesce(p_limit, 50), 50)) as page_size,
      greatest(0, coalesce(p_offset, 0)) as page_offset
  )
  select case
    when not private.current_user_has_project_permission(
      p_project_id,
      'project.members.read'
    ) then null
    else jsonb_build_object(
      'owner', (
        select jsonb_build_object(
          'user_id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'email', u.email,
          'role_code', 'owner'
        )
        from public.projects p
        join public.users u on u.id = p.owner_id
        where p.id = p_project_id
          and p.deleted_at is null
      ),
      'members', (
        select coalesce(jsonb_agg(member_row.payload order by member_row.joined_at, member_row.id), '[]'::jsonb)
        from (
          select
            pm.id,
            pm.joined_at,
            jsonb_build_object(
              'id', pm.id,
              'user_id', u.id,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'email', u.email,
              'role_code', pm.role_code,
              'joined_at', pm.joined_at
            ) as payload
          from public.project_memberships pm
          join public.users u on u.id = pm.user_id
          cross join paging
          where pm.project_id = p_project_id
            and pm.removed_at is null
            and u.deleted_at is null
          order by pm.joined_at, pm.id
          limit (select page_size from paging)
          offset (select page_offset from paging)
        ) member_row
      ),
      'invitations', (
        select case
          when private.current_user_has_project_permission(
            p_project_id,
            'project.members.manage'
          ) then coalesce(jsonb_agg(invitation_row.payload order by invitation_row.created_at desc, invitation_row.id), '[]'::jsonb)
          else '[]'::jsonb
        end
        from (
          select
            pi.id,
            pi.created_at,
            jsonb_build_object(
              'id', pi.id,
              'email', pi.invited_email,
              'role_code', pi.role_code,
              'status', case
                when pi.expires_at <= current_timestamp then 'expired'
                else pi.status::text
              end,
              'delivery_status', pi.delivery_status,
              'expires_at', pi.expires_at,
              'last_sent_at', pi.last_sent_at,
              'created_at', pi.created_at
            ) as payload
          from public.project_invitations pi
          cross join paging
          where pi.project_id = p_project_id
            and pi.status = 'pending'
          order by pi.created_at desc, pi.id
          limit (select page_size from paging)
          offset (select page_offset from paging)
        ) invitation_row
      ),
      'has_more', (
        exists (
          select 1
          from public.project_memberships pm
          join public.users u on u.id = pm.user_id
          cross join paging
          where pm.project_id = p_project_id
            and pm.removed_at is null
            and u.deleted_at is null
          offset ((select page_offset + page_size from paging))
          limit 1
        )
        or (
          private.current_user_has_project_permission(
            p_project_id,
            'project.members.manage'
          )
          and exists (
            select 1
            from public.project_invitations pi
            cross join paging
            where pi.project_id = p_project_id
              and pi.status = 'pending'
            offset ((select page_offset + page_size from paging))
            limit 1
          )
        )
      ),
      'next_page', case
        when (
          exists (
            select 1
            from public.project_memberships pm
            join public.users u on u.id = pm.user_id
            cross join paging
            where pm.project_id = p_project_id
              and pm.removed_at is null
              and u.deleted_at is null
            offset ((select page_offset + page_size from paging))
            limit 1
          )
          or (
            private.current_user_has_project_permission(
              p_project_id,
              'project.members.manage'
            )
            and exists (
              select 1
              from public.project_invitations pi
              cross join paging
              where pi.project_id = p_project_id
                and pi.status = 'pending'
              offset ((select page_offset + page_size from paging))
              limit 1
            )
          )
        ) then (
          select (page_offset / page_size) + 1 from paging
        )
        else null
      end
    )
  end
  from paging;
$$;

create or replace function private.list_my_project_invitations(
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with paging as (
    select
      greatest(1, least(coalesce(p_limit, 50), 50)) as page_size,
      greatest(0, coalesce(p_offset, 0)) as page_offset
  ),
  invitation_rows as (
    select
      pi.id,
      pi.created_at,
      jsonb_build_object(
        'id', pi.id,
        'project_id', p.id,
        'project_name', p.name,
        'role_code', pi.role_code,
        'inviter_name', trim(concat(u.first_name, ' ', coalesce(u.last_name, ''))),
        'expires_at', pi.expires_at,
        'created_at', pi.created_at
      ) as payload
    from public.project_invitations pi
    join public.projects p on p.id = pi.project_id and p.deleted_at is null
    join public.users u on u.id = pi.invited_by
    cross join paging
    where pi.invited_email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and pi.status = 'pending'
      and pi.expires_at > current_timestamp
    order by pi.created_at desc, pi.id
    limit (select page_size + 1 from paging)
    offset (select page_offset from paging)
  )
  select jsonb_build_object(
    'items', coalesce(
      (
        select jsonb_agg(page_row.payload order by page_row.created_at desc, page_row.id)
        from (
          select invitation_rows.*
          from invitation_rows
          limit (select page_size from paging)
        ) page_row
      ),
      '[]'::jsonb
    ),
    'has_more', (select count(*) from invitation_rows) > (select page_size from paging),
    'next_page', case
      when (select count(*) from invitation_rows) > (select page_size from paging)
        then (select (page_offset / page_size) + 1 from paging)
      else null
    end
  )
  from paging;
$$;

create or replace function private.archive_project_collaboration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    update public.project_memberships
    set
      removed_at = current_timestamp,
      removed_by = (select auth.uid()),
      updated_at = current_timestamp
    where project_id = new.id
      and removed_at is null;

    update public.project_invitations
    set
      status = 'revoked',
      revoked_by = (select auth.uid()),
      responded_at = current_timestamp,
      updated_at = current_timestamp
    where project_id = new.id
      and status = 'pending';

    insert into public.project_collaboration_events (
      project_id,
      event_type,
      actor_id
    )
    values (new.id, 'project_archived', (select auth.uid()));
  end if;

  return new;
end;
$$;

revoke all on function private.assert_assignable_project_role(text)
from public, anon;
revoke all on function private.create_project_invitation(uuid, text, text, text, timestamptz)
from public, anon;
revoke all on function private.resend_project_invitation(uuid, text, timestamptz)
from public, anon;
revoke all on function private.respond_project_invitation(uuid, text)
from public, anon;
revoke all on function private.revoke_project_invitation(uuid)
from public, anon;
revoke all on function private.set_project_invitation_delivery(uuid, integer, text)
from public, anon;
revoke all on function private.update_project_member_role(uuid, text)
from public, anon;
revoke all on function private.remove_project_member(uuid)
from public, anon;
revoke all on function private.leave_project(uuid)
from public, anon;
revoke all on function private.list_project_members(uuid, integer, integer)
from public, anon;
revoke all on function private.list_my_project_invitations(integer, integer)
from public, anon;
revoke all on function private.archive_project_collaboration()
from public, anon, authenticated;

grant execute on function private.create_project_invitation(uuid, text, text, text, timestamptz)
to authenticated;
grant execute on function private.resend_project_invitation(uuid, text, timestamptz)
to authenticated;
grant execute on function private.respond_project_invitation(uuid, text)
to authenticated;
grant execute on function private.revoke_project_invitation(uuid)
to authenticated;
grant execute on function private.set_project_invitation_delivery(uuid, integer, text)
to authenticated;
grant execute on function private.update_project_member_role(uuid, text)
to authenticated;
grant execute on function private.remove_project_member(uuid)
to authenticated;
grant execute on function private.leave_project(uuid)
to authenticated;
grant execute on function private.list_project_members(uuid, integer, integer)
to authenticated;
grant execute on function private.list_my_project_invitations(integer, integer)
to authenticated;

create or replace function public.create_project_invitation(
  p_project_id uuid,
  p_email text,
  p_role_code text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select to_jsonb(private.create_project_invitation(
    p_project_id,
    p_email,
    p_role_code,
    p_token_hash,
    p_expires_at
  ));
$$;

create or replace function public.resend_project_invitation(
  p_invitation_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select to_jsonb(private.resend_project_invitation(
    p_invitation_id,
    p_token_hash,
    p_expires_at
  ));
$$;

create or replace function public.respond_project_invitation(
  p_invitation_id uuid,
  p_response text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.respond_project_invitation(p_invitation_id, p_response);
$$;

create or replace function public.revoke_project_invitation(p_invitation_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.revoke_project_invitation(p_invitation_id);
$$;

create or replace function public.set_project_invitation_delivery(
  p_invitation_id uuid,
  p_delivery_version integer,
  p_delivery_status text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_project_invitation_delivery(
    p_invitation_id,
    p_delivery_version,
    p_delivery_status
  );
$$;

create or replace function public.update_project_member_role(
  p_membership_id uuid,
  p_role_code text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select to_jsonb(private.update_project_member_role(
    p_membership_id,
    p_role_code
  ));
$$;

create or replace function public.remove_project_member(p_membership_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.remove_project_member(p_membership_id);
$$;

create or replace function public.leave_project(p_project_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.leave_project(p_project_id);
$$;

create or replace function public.list_project_members(
  p_project_id uuid,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.list_project_members(p_project_id, p_limit, p_offset);
$$;

create or replace function public.list_my_project_invitations(
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.list_my_project_invitations(p_limit, p_offset);
$$;

revoke execute on function public.create_project_invitation(uuid, text, text, text, timestamptz)
from public, anon;
revoke execute on function public.resend_project_invitation(uuid, text, timestamptz)
from public, anon;
revoke execute on function public.respond_project_invitation(uuid, text)
from public, anon;
revoke execute on function public.revoke_project_invitation(uuid)
from public, anon;
revoke execute on function public.set_project_invitation_delivery(uuid, integer, text)
from public, anon;
revoke execute on function public.update_project_member_role(uuid, text)
from public, anon;
revoke execute on function public.remove_project_member(uuid)
from public, anon;
revoke execute on function public.leave_project(uuid)
from public, anon;
revoke execute on function public.list_project_members(uuid, integer, integer)
from public, anon;
revoke execute on function public.list_my_project_invitations(integer, integer)
from public, anon;

grant execute on function public.create_project_invitation(uuid, text, text, text, timestamptz)
to authenticated;
grant execute on function public.resend_project_invitation(uuid, text, timestamptz)
to authenticated;
grant execute on function public.respond_project_invitation(uuid, text)
to authenticated;
grant execute on function public.revoke_project_invitation(uuid)
to authenticated;
grant execute on function public.set_project_invitation_delivery(uuid, integer, text)
to authenticated;
grant execute on function public.update_project_member_role(uuid, text)
to authenticated;
grant execute on function public.remove_project_member(uuid)
to authenticated;
grant execute on function public.leave_project(uuid)
to authenticated;
grant execute on function public.list_project_members(uuid, integer, integer)
to authenticated;
grant execute on function public.list_my_project_invitations(integer, integer)
to authenticated;

create trigger projects_archive_collaboration
after update of deleted_at
on public.projects
for each row
execute function private.archive_project_collaboration();
