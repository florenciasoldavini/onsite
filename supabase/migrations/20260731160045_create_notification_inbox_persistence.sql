create extension if not exists pg_cron with schema pg_catalog;

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null check (
    source_kind ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
  ),
  source_event_id text not null check (
    source_event_id = trim(source_event_id)
    and char_length(source_event_id) between 1 and 200
  ),
  event_code text not null,
  category_code text not null,
  schema_version smallint not null default 1 check (schema_version = 1),
  actor_id uuid not null references public.users(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  invitation_id uuid references public.project_invitations(id) on delete restrict,
  destination_kind text not null,
  project_name_snapshot text not null check (
    char_length(trim(project_name_snapshot)) between 1 and 160
  ),
  actor_display_name_snapshot text not null check (
    char_length(trim(actor_display_name_snapshot)) between 1 and 240
  ),
  previous_role_code text references public.project_roles(code) on delete restrict,
  next_role_code text references public.project_roles(code) on delete restrict,
  created_at timestamptz(3) not null default current_timestamp,
  constraint notification_events_source_unique unique (source_kind, source_event_id),
  constraint notification_events_contract check (
    (
      event_code = 'project.invitation_received'
      and category_code = 'project.invitations'
      and destination_kind = 'project_invitations'
      and invitation_id is not null
      and previous_role_code is null
      and next_role_code is not null
    )
    or (
      event_code in (
        'project.invitation_accepted',
        'project.invitation_declined'
      )
      and category_code = 'project.invitations'
      and destination_kind = 'project_team'
      and invitation_id is not null
      and previous_role_code is null
      and next_role_code is not null
    )
    or (
      event_code = 'project.member_role_changed'
      and category_code = 'project.team_activity'
      and destination_kind = 'project_team'
      and invitation_id is null
      and previous_role_code is not null
      and next_role_code is not null
      and previous_role_code <> next_role_code
    )
    or (
      event_code = 'project.member_removed'
      and category_code = 'project.team_activity'
      and destination_kind = 'none'
      and invitation_id is null
      and previous_role_code is not null
      and next_role_code is null
    )
    or (
      event_code = 'project.member_left'
      and category_code = 'project.team_activity'
      and destination_kind = 'project_team'
      and invitation_id is null
      and previous_role_code is not null
      and next_role_code is null
    )
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events(id) on delete restrict,
  recipient_id uuid not null references public.users(id) on delete restrict,
  read_at timestamptz(3),
  archived_at timestamptz(3),
  created_at timestamptz(3) not null default current_timestamp,
  constraint notifications_event_recipient_unique unique (event_id, recipient_id),
  constraint notifications_archive_timing check (
    archived_at is null or archived_at >= created_at
  )
);

create index notification_events_actor_idx
on public.notification_events(actor_id);

create index notification_events_project_idx
on public.notification_events(project_id);

create index notification_events_invitation_idx
on public.notification_events(invitation_id)
where invitation_id is not null;

create index notification_events_previous_role_idx
on public.notification_events(previous_role_code)
where previous_role_code is not null;

create index notification_events_next_role_idx
on public.notification_events(next_role_code)
where next_role_code is not null;

create index notifications_recipient_idx
on public.notifications(recipient_id);

create index notifications_active_inbox_idx
on public.notifications(recipient_id, created_at desc, id desc)
where archived_at is null;

create index notifications_active_unread_idx
on public.notifications(recipient_id, id)
where archived_at is null and read_at is null;

create index notifications_archive_due_idx
on public.notifications(created_at, id)
where archived_at is null;

create index notifications_purge_due_idx
on public.notifications(created_at, id)
where archived_at is not null;

revoke all on table public.notification_events
from public, anon, authenticated, service_role;
revoke all on table public.notifications
from public, anon, authenticated, service_role;

grant select on table public.notification_events to authenticated, service_role;
grant select on table public.notifications to authenticated, service_role;

alter table public.notification_events enable row level security;
alter table public.notifications enable row level security;

create policy "notifications_read_recipient_or_admin"
on public.notifications for select to authenticated
using (
  archived_at is null
  and (
    recipient_id = (select auth.uid())
    or (select private.current_user_is_admin())
  )
);

create policy "notification_events_read_recipient_or_admin"
on public.notification_events for select to authenticated
using (
  exists (
    select 1
    from public.notifications notification
    where notification.event_id = notification_events.id
      and notification.archived_at is null
      and (
        notification.recipient_id = (select auth.uid())
        or (select private.current_user_is_admin())
      )
  )
);

create or replace function private.persist_notification(
  p_source_kind text,
  p_source_event_id text,
  p_event_code text,
  p_category_code text,
  p_schema_version integer,
  p_actor_id uuid,
  p_recipient_id uuid,
  p_project_id uuid,
  p_invitation_id uuid,
  p_destination_kind text,
  p_project_name_snapshot text,
  p_actor_display_name_snapshot text,
  p_previous_role_code text default null,
  p_next_role_code text default null,
  p_created_at timestamptz default current_timestamp
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_event public.notification_events;
  notification_id uuid;
begin
  if p_actor_id = p_recipient_id then
    return null;
  end if;

  if not exists (
    select 1
    from public.users
    where id = p_recipient_id
      and deleted_at is null
  ) then
    raise exception 'The notification recipient is unavailable.'
      using errcode = '23503';
  end if;

  insert into public.notification_events (
    source_kind,
    source_event_id,
    event_code,
    category_code,
    schema_version,
    actor_id,
    project_id,
    invitation_id,
    destination_kind,
    project_name_snapshot,
    actor_display_name_snapshot,
    previous_role_code,
    next_role_code,
    created_at
  )
  values (
    p_source_kind,
    p_source_event_id,
    p_event_code,
    p_category_code,
    p_schema_version,
    p_actor_id,
    p_project_id,
    p_invitation_id,
    p_destination_kind,
    p_project_name_snapshot,
    p_actor_display_name_snapshot,
    p_previous_role_code,
    p_next_role_code,
    p_created_at
  )
  on conflict (source_kind, source_event_id) do nothing
  returning * into stored_event;

  if stored_event.id is null then
    select * into stored_event
    from public.notification_events
    where source_kind = p_source_kind
      and source_event_id = p_source_event_id;

    if stored_event.event_code is distinct from p_event_code
      or stored_event.category_code is distinct from p_category_code
      or stored_event.schema_version is distinct from p_schema_version
      or stored_event.actor_id is distinct from p_actor_id
      or stored_event.project_id is distinct from p_project_id
      or stored_event.invitation_id is distinct from p_invitation_id
      or stored_event.destination_kind is distinct from p_destination_kind
      or stored_event.project_name_snapshot is distinct from p_project_name_snapshot
      or stored_event.actor_display_name_snapshot is distinct from p_actor_display_name_snapshot
      or stored_event.previous_role_code is distinct from p_previous_role_code
      or stored_event.next_role_code is distinct from p_next_role_code
    then
      raise exception 'The notification source identity is already in use.'
        using errcode = '23505';
    end if;
  end if;

  insert into public.notifications (
    event_id,
    recipient_id,
    created_at
  )
  values (
    stored_event.id,
    p_recipient_id,
    stored_event.created_at
  )
  on conflict (event_id, recipient_id) do nothing
  returning id into notification_id;

  if notification_id is null then
    select id into notification_id
    from public.notifications
    where event_id = stored_event.id
      and recipient_id = p_recipient_id;
  end if;

  return notification_id;
end;
$$;

create or replace function public.list_my_notifications(
  p_limit integer default 20,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  page_size integer := greatest(1, least(coalesce(p_limit, 20), 50));
  result jsonb;
begin
  if (p_before_created_at is null) <> (p_before_id is null) then
    raise exception 'The notification cursor is invalid.' using errcode = '22023';
  end if;

  with notification_rows as (
    select
      notification.id,
      notification.event_id,
      event.event_code,
      event.category_code,
      event.schema_version,
      event.actor_id,
      event.project_id,
      event.invitation_id,
      event.destination_kind,
      event.project_name_snapshot,
      event.actor_display_name_snapshot,
      event.previous_role_code,
      event.next_role_code,
      notification.read_at,
      notification.created_at
    from public.notifications notification
    join public.notification_events event on event.id = notification.event_id
    where notification.recipient_id = (select auth.uid())
      and notification.archived_at is null
      and (
        p_before_created_at is null
        or (notification.created_at, notification.id) < (
          p_before_created_at,
          p_before_id
        )
      )
    order by notification.created_at desc, notification.id desc
    limit page_size + 1
  ),
  page_rows as (
    select *
    from notification_rows
    order by created_at desc, id desc
    limit page_size
  )
  select jsonb_build_object(
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', page.id,
            'event_id', page.event_id,
            'event_code', page.event_code,
            'category_code', page.category_code,
            'schema_version', page.schema_version,
            'actor_id', page.actor_id,
            'project_id', page.project_id,
            'invitation_id', page.invitation_id,
            'destination_kind', page.destination_kind,
            'project_name', page.project_name_snapshot,
            'actor_display_name', page.actor_display_name_snapshot,
            'previous_role_code', page.previous_role_code,
            'next_role_code', page.next_role_code,
            'read_at', page.read_at,
            'created_at', page.created_at
          )
          order by page.created_at desc, page.id desc
        )
        from page_rows page
      ),
      '[]'::jsonb
    ),
    'has_more', (select count(*) from notification_rows) > page_size,
    'next_cursor', case
      when (select count(*) from notification_rows) > page_size then (
        select jsonb_build_object(
          'created_at', cursor_row.created_at,
          'id', cursor_row.id
        )
        from page_rows cursor_row
        order by cursor_row.created_at, cursor_row.id
        limit 1
      )
      else null
    end
  ) into result;

  return result;
end;
$$;

create or replace function public.get_my_notification_unread_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)
  from public.notifications
  where recipient_id = (select auth.uid())
    and archived_at is null
    and read_at is null;
$$;

create or replace function private.mark_notification_read(p_notification_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  notification_read_at timestamptz;
begin
  if actor_id is null then
    return null;
  end if;

  update public.notifications
  set read_at = coalesce(read_at, current_timestamp)
  where id = p_notification_id
    and recipient_id = actor_id
    and archived_at is null
  returning read_at into notification_read_at;

  return notification_read_at;
end;
$$;

create or replace function private.mark_all_my_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  updated_count integer;
begin
  if actor_id is null then
    return 0;
  end if;

  update public.notifications
  set read_at = current_timestamp
  where recipient_id = actor_id
    and archived_at is null
    and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns timestamptz
language sql
security invoker
set search_path = ''
as $$
  select private.mark_notification_read(p_notification_id);
$$;

create or replace function public.mark_all_my_notifications_read()
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.mark_all_my_notifications_read();
$$;

create or replace function private.apply_notification_retention(
  p_as_of timestamptz default current_timestamp,
  p_batch_size integer default 5000
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  batch_size integer := greatest(1, least(coalesce(p_batch_size, 5000), 5000));
  archived_count integer;
  purged_count integer;
  orphan_event_count integer;
begin
  with archive_candidates as (
    select id
    from public.notifications
    where archived_at is null
      and created_at <= p_as_of - interval '90 days'
    order by created_at, id
    limit batch_size
    for update skip locked
  )
  update public.notifications notification
  set archived_at = notification.created_at + interval '90 days'
  from archive_candidates candidate
  where notification.id = candidate.id;

  get diagnostics archived_count = row_count;

  with purge_candidates as (
    select id
    from public.notifications
    where archived_at is not null
      and created_at <= p_as_of - interval '120 days'
    order by created_at, id
    limit batch_size
    for update skip locked
  )
  delete from public.notifications notification
  using purge_candidates candidate
  where notification.id = candidate.id;

  get diagnostics purged_count = row_count;

  with orphan_candidates as (
    select event.id
    from public.notification_events event
    where not exists (
      select 1
      from public.notifications notification
      where notification.event_id = event.id
    )
    order by event.created_at, event.id
    limit batch_size
    for update skip locked
  )
  delete from public.notification_events event
  using orphan_candidates candidate
  where event.id = candidate.id;

  get diagnostics orphan_event_count = row_count;

  return jsonb_build_object(
    'archived_count', archived_count,
    'purged_count', purged_count,
    'orphan_event_count', orphan_event_count
  );
end;
$$;

revoke all on function private.persist_notification(
  text,
  text,
  text,
  text,
  integer,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated, service_role;
revoke all on function private.mark_notification_read(uuid)
from public, anon;
revoke all on function private.mark_all_my_notifications_read()
from public, anon;
revoke all on function private.apply_notification_retention(timestamptz, integer)
from public, anon, authenticated, service_role;

grant execute on function private.mark_notification_read(uuid) to authenticated;
grant execute on function private.mark_all_my_notifications_read() to authenticated;

revoke execute on function public.list_my_notifications(integer, timestamptz, uuid)
from public, anon;
revoke execute on function public.get_my_notification_unread_count()
from public, anon;
revoke execute on function public.mark_notification_read(uuid)
from public, anon;
revoke execute on function public.mark_all_my_notifications_read()
from public, anon;

grant execute on function public.list_my_notifications(integer, timestamptz, uuid)
to authenticated;
grant execute on function public.get_my_notification_unread_count()
to authenticated;
grant execute on function public.mark_notification_read(uuid)
to authenticated;
grant execute on function public.mark_all_my_notifications_read()
to authenticated;

select cron.unschedule('notifications-retention-daily')
where exists (
  select 1
  from cron.job
  where jobname = 'notifications-retention-daily'
);

select cron.schedule(
  'notifications-retention-daily',
  '15 3 * * *',
  'select private.apply_notification_retention();'
);

comment on table public.notification_events is
  'Immutable trusted semantic notification events. Source-domain events remain authoritative history.';
comment on table public.notifications is
  'Recipient-scoped notification inbox rows with server-owned read and retention state.';
comment on column public.notification_events.project_name_snapshot is
  'Verbatim project-name snapshot allowed by the notification content-safety contract.';
comment on column public.notification_events.actor_display_name_snapshot is
  'Verbatim actor-name snapshot allowed by the notification content-safety contract.';
comment on function private.persist_notification(
  text,
  text,
  text,
  text,
  integer,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  timestamptz
) is
  'Trusted idempotent notification persistence boundary; unavailable to API clients.';
comment on function public.list_my_notifications(integer, timestamptz, uuid) is
  'Returns one bounded newest-first keyset page for auth.uid().';
comment on function public.get_my_notification_unread_count() is
  'Returns the active unread notification count for auth.uid().';
comment on function public.mark_notification_read(uuid) is
  'Idempotently marks one active notification owned by auth.uid() as read.';
comment on function public.mark_all_my_notifications_read() is
  'Atomically marks all active unread notifications owned by auth.uid() as read.';
comment on function private.apply_notification_retention(timestamptz, integer) is
  'Archives notifications after 90 days and permanently purges them after 120 days in bounded batches.';
