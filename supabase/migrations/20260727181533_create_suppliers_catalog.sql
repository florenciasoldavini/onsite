create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 120),
  contact_name text check (
    contact_name is null
    or char_length(trim(contact_name)) between 1 and 160
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
  website_url text check (
    website_url is null
    or (
      char_length(trim(website_url)) between 8 and 2048
      and website_url ~ '^https?://'
    )
  ),
  address text check (
    address is null
    or char_length(trim(address)) between 4 and 500
  ),
  google_place_id text check (
    google_place_id is null
    or char_length(trim(google_place_id)) between 3 and 255
  ),
  latitude double precision check (
    latitude is null
    or latitude between -90 and 90
  ),
  longitude double precision check (
    longitude is null
    or longitude between -180 and 180
  ),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3),
  deleted_at timestamp(3),
  constraint suppliers_address_bundle check (
    (
      address is null
      and google_place_id is null
      and latitude is null
      and longitude is null
    )
    or (
      address is not null
      and google_place_id is not null
      and latitude is not null
      and longitude is not null
    )
  )
);

create index suppliers_owner_id_idx on public.suppliers(owner_id);
create index suppliers_deleted_at_idx on public.suppliers(deleted_at);
create index suppliers_visible_owner_name_idx
on public.suppliers(owner_id, name, id)
where deleted_at is null;
create index suppliers_visible_created_idx
on public.suppliers(created_at desc, id)
where deleted_at is null;

revoke all on table public.suppliers from anon, authenticated;
grant select, insert on table public.suppliers to authenticated;
grant update (
  name,
  contact_name,
  phone_number,
  email,
  website_url,
  address,
  google_place_id,
  latitude,
  longitude,
  notes,
  updated_at,
  deleted_at
) on table public.suppliers to authenticated;

alter table public.suppliers enable row level security;

create or replace function public.normalize_supplier_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.name := trim(new.name);
  new.contact_name := nullif(trim(new.contact_name), '');
  new.phone_number := nullif(trim(new.phone_number), '');
  new.email := lower(nullif(trim(new.email), ''));
  new.website_url := nullif(trim(new.website_url), '');
  new.address := nullif(trim(new.address), '');
  new.google_place_id := nullif(trim(new.google_place_id), '');
  new.notes := nullif(trim(new.notes), '');
  return new;
end;
$$;

revoke all on function public.normalize_supplier_fields()
from public, anon, authenticated;

create trigger suppliers_normalize_fields
before insert or update of
  name,
  contact_name,
  phone_number,
  email,
  website_url,
  address,
  google_place_id,
  notes
on public.suppliers
for each row
execute function public.normalize_supplier_fields();

create policy "suppliers_select_owner_or_admin"
on public.suppliers
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

create policy "suppliers_insert_own_supplier"
on public.suppliers
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
  and deleted_at is null
);

create policy "suppliers_update_owner_or_admin"
on public.suppliers
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
