create table public.workers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete restrict,
  contractor_id uuid references public.contractors(id) on delete restrict,
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

create table public.worker_trade_categories (
  worker_id uuid not null references public.workers(id) on delete restrict,
  trade_category_id uuid not null
    references public.trade_categories(id) on delete restrict,
  created_at timestamp(3) not null default current_timestamp,
  primary key (worker_id, trade_category_id)
);

create index workers_owner_id_idx on public.workers(owner_id);
create index workers_contractor_id_idx on public.workers(contractor_id);
create index workers_deleted_at_idx on public.workers(deleted_at);
create index workers_visible_owner_name_idx
on public.workers(owner_id, first_name, last_name, id)
where deleted_at is null;
create index workers_visible_created_idx
on public.workers(created_at desc, id)
where deleted_at is null;
create index worker_trade_categories_trade_worker_idx
on public.worker_trade_categories(trade_category_id, worker_id);

revoke all on table public.workers from anon, authenticated;
grant select, insert on table public.workers to authenticated;
grant update (
  contractor_id,
  first_name,
  last_name,
  phone_number,
  email,
  updated_at,
  deleted_at
) on table public.workers to authenticated;

revoke all on table public.worker_trade_categories from anon, authenticated;
grant select, insert, delete
on table public.worker_trade_categories
to authenticated;

alter table public.workers enable row level security;
alter table public.worker_trade_categories enable row level security;

create or replace function public.normalize_worker_contact_fields()
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

revoke all on function public.normalize_worker_contact_fields()
from public, anon, authenticated;

create trigger workers_normalize_contact_fields
before insert or update of first_name, last_name, phone_number, email
on public.workers
for each row
execute function public.normalize_worker_contact_fields();

create or replace function public.enforce_worker_contractor_link()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  contractor_owner_id uuid;
begin
  if new.contractor_id is null then
    return new;
  end if;

  select owner_id
  into contractor_owner_id
  from public.contractors
  where id = new.contractor_id
    and deleted_at is null;

  if contractor_owner_id is null or contractor_owner_id <> new.owner_id then
    raise exception 'Worker contractor is unavailable.' using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_worker_contractor_link()
from public, anon, authenticated;

create trigger workers_enforce_contractor_link
before insert or update of contractor_id, owner_id
on public.workers
for each row
execute function public.enforce_worker_contractor_link();

create or replace function public.unlink_workers_before_contractor_archive()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    update public.workers
    set
      contractor_id = null,
      updated_at = current_timestamp
    where contractor_id = old.id
      and deleted_at is null;
  end if;

  return new;
end;
$$;

revoke all on function public.unlink_workers_before_contractor_archive()
from public, anon, authenticated;

create trigger contractors_unlink_workers_before_archive
before update of deleted_at
on public.contractors
for each row
execute function public.unlink_workers_before_contractor_archive();

create policy "workers_select_owner_or_admin"
on public.workers
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or (select public.is_current_user_admin())
  )
);

create policy "workers_insert_own_worker"
on public.workers
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
  and deleted_at is null
);

create policy "workers_update_owner_or_admin"
on public.workers
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

create policy "worker_trade_categories_select_owner_or_admin"
on public.worker_trade_categories
for select
to authenticated
using (
  exists (
    select 1
    from public.workers
    where workers.id = worker_trade_categories.worker_id
      and (
        workers.owner_id = (select auth.uid())
        or (select public.is_current_user_admin())
      )
  )
);

create policy "worker_trade_categories_insert_owner_or_admin"
on public.worker_trade_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workers
    where workers.id = worker_trade_categories.worker_id
      and workers.deleted_at is null
      and (
        workers.owner_id = (select auth.uid())
        or (select public.is_current_user_admin())
      )
  )
  and exists (
    select 1
    from public.trade_categories
    where trade_categories.id = worker_trade_categories.trade_category_id
      and trade_categories.deleted_at is null
  )
);

create policy "worker_trade_categories_delete_owner_or_admin"
on public.worker_trade_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.workers
    where workers.id = worker_trade_categories.worker_id
      and workers.deleted_at is null
      and (
        workers.owner_id = (select auth.uid())
        or (select public.is_current_user_admin())
      )
  )
);

create or replace function public.create_worker_with_relationships(
  p_first_name text,
  p_last_name text default null,
  p_phone_number text default null,
  p_email text default null,
  p_contractor_id uuid default null,
  p_trade_category_ids uuid[] default '{}'::uuid[]
)
returns public.workers
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_worker public.workers;
  category_ids uuid[] := coalesce(p_trade_category_ids, '{}'::uuid[]);
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if cardinality(category_ids) <> (
    select count(distinct category_id)
    from unnest(category_ids) as requested(category_id)
  ) then
    raise exception 'Trade categories must be unique.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(category_ids) as requested(category_id)
    left join public.trade_categories
      on trade_categories.id = requested.category_id
      and trade_categories.deleted_at is null
    where trade_categories.id is null
  ) then
    raise exception 'One or more trade categories are unavailable.'
      using errcode = '23503';
  end if;

  insert into public.workers (
    owner_id,
    contractor_id,
    first_name,
    last_name,
    phone_number,
    email
  )
  values (
    (select auth.uid()),
    p_contractor_id,
    p_first_name,
    p_last_name,
    p_phone_number,
    p_email
  )
  returning * into saved_worker;

  insert into public.worker_trade_categories (worker_id, trade_category_id)
  select saved_worker.id, category_id
  from unnest(category_ids) as requested(category_id);

  return saved_worker;
end;
$$;

create or replace function public.update_worker_with_relationships(
  p_worker_id uuid,
  p_first_name text,
  p_last_name text default null,
  p_phone_number text default null,
  p_email text default null,
  p_contractor_id uuid default null,
  p_trade_category_ids uuid[] default '{}'::uuid[]
)
returns public.workers
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_worker public.workers;
  category_ids uuid[] := coalesce(p_trade_category_ids, '{}'::uuid[]);
begin
  if cardinality(category_ids) <> (
    select count(distinct category_id)
    from unnest(category_ids) as requested(category_id)
  ) then
    raise exception 'Trade categories must be unique.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(category_ids) as requested(category_id)
    left join public.trade_categories
      on trade_categories.id = requested.category_id
      and trade_categories.deleted_at is null
    where trade_categories.id is null
  ) then
    raise exception 'One or more trade categories are unavailable.'
      using errcode = '23503';
  end if;

  update public.workers
  set
    contractor_id = p_contractor_id,
    first_name = p_first_name,
    last_name = p_last_name,
    phone_number = p_phone_number,
    email = p_email,
    updated_at = current_timestamp
  where id = p_worker_id
    and deleted_at is null
  returning * into saved_worker;

  if saved_worker.id is null then
    raise exception 'Worker is unavailable.' using errcode = 'P0002';
  end if;

  delete from public.worker_trade_categories
  where worker_id = p_worker_id;

  insert into public.worker_trade_categories (worker_id, trade_category_id)
  select p_worker_id, category_id
  from unnest(category_ids) as requested(category_id);

  return saved_worker;
end;
$$;

revoke all on function public.create_worker_with_relationships(
  text,
  text,
  text,
  text,
  uuid,
  uuid[]
) from public, anon;
grant execute on function public.create_worker_with_relationships(
  text,
  text,
  text,
  text,
  uuid,
  uuid[]
) to authenticated;

revoke all on function public.update_worker_with_relationships(
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  uuid[]
) from public, anon;
grant execute on function public.update_worker_with_relationships(
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  uuid[]
) to authenticated;
