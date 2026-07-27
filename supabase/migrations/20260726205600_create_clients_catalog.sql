create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete restrict,
  first_name text not null check (char_length(trim(first_name)) between 1 and 80),
  last_name text check (
    last_name is null
    or char_length(trim(last_name)) between 1 and 80
  ),
  phone_number text check (
    phone_number is null
    or char_length(trim(phone_number)) between 3 and 40
  ),
  email text check (
    email is null
    or (
      char_length(trim(email)) between 3 and 254
      and email = lower(email)
    )
  ),
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3),
  deleted_at timestamp(3)
);

create index clients_owner_id_idx on public.clients(owner_id);
create index clients_deleted_at_idx on public.clients(deleted_at);
create index clients_visible_owner_name_idx
on public.clients(owner_id, first_name, last_name, id)
where deleted_at is null;
create index clients_visible_created_idx
on public.clients(created_at desc, id)
where deleted_at is null;

alter table public.projects
add column client_id uuid references public.clients(id) on delete restrict;

create index projects_client_id_idx on public.projects(client_id);
create index projects_visible_client_created_idx
on public.projects(client_id, created_at desc, id)
where deleted_at is null and client_id is not null;

grant select, insert, update on table public.clients to authenticated;

alter table public.clients enable row level security;

create or replace function public.normalize_client_contact_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.first_name := trim(new.first_name);
  new.last_name := nullif(trim(new.last_name), '');
  new.phone_number := nullif(trim(new.phone_number), '');
  new.email := lower(nullif(trim(new.email), ''));
  return new;
end;
$$;

revoke all on function public.normalize_client_contact_fields()
from public, anon, authenticated;

create trigger clients_normalize_contact_fields
before insert or update of first_name, last_name, phone_number, email
on public.clients
for each row
execute function public.normalize_client_contact_fields();

create policy "clients_select_owner_or_admin"
on public.clients
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

create policy "clients_insert_own_client"
on public.clients
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
  and deleted_at is null
);

create policy "clients_update_owner_or_admin"
on public.clients
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

create or replace function public.enforce_project_client_link()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  client_owner_id uuid;
begin
  if new.deleted_at is not null then
    new.client_id := null;
    return new;
  end if;

  if new.client_id is null then
    return new;
  end if;

  select owner_id
  into client_owner_id
  from public.clients
  where id = new.client_id
    and deleted_at is null;

  if client_owner_id is null or client_owner_id <> new.owner_id then
    raise exception 'Project client is unavailable.' using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_project_client_link()
from public, anon, authenticated;

create trigger projects_enforce_client_link
before insert or update of client_id, owner_id, deleted_at
on public.projects
for each row
execute function public.enforce_project_client_link();

create or replace function public.unlink_projects_before_client_archive()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    update public.projects
    set
      client_id = null,
      updated_at = current_timestamp
    where client_id = old.id
      and deleted_at is null;
  end if;

  return new;
end;
$$;

revoke all on function public.unlink_projects_before_client_archive()
from public, anon, authenticated;

create trigger clients_unlink_projects_before_archive
before update of deleted_at
on public.clients
for each row
execute function public.unlink_projects_before_client_archive();
