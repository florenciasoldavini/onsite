create table public.contractors (
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

create index contractors_owner_id_idx on public.contractors(owner_id);
create index contractors_deleted_at_idx on public.contractors(deleted_at);
create index contractors_visible_owner_name_idx
on public.contractors(owner_id, first_name, last_name, id)
where deleted_at is null;
create index contractors_visible_created_idx
on public.contractors(created_at desc, id)
where deleted_at is null;

revoke all on table public.contractors from anon, authenticated;
grant select, insert on table public.contractors to authenticated;
grant update (
  first_name,
  last_name,
  phone_number,
  email,
  updated_at,
  deleted_at
) on table public.contractors to authenticated;

alter table public.contractors enable row level security;

create or replace function public.normalize_contractor_contact_fields()
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

revoke all on function public.normalize_contractor_contact_fields()
from public, anon, authenticated;

create trigger contractors_normalize_contact_fields
before insert or update of first_name, last_name, phone_number, email
on public.contractors
for each row
execute function public.normalize_contractor_contact_fields();

create policy "contractors_select_owner_or_admin"
on public.contractors
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
);

create policy "contractors_insert_own_contractor"
on public.contractors
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
  and deleted_at is null
);

create policy "contractors_update_owner_or_admin"
on public.contractors
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
