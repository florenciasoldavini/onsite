begin;

create extension if not exists pgtap with schema extensions;

select plan(41);

insert into public.users (id, first_name, last_name, email, role, deleted_at)
values
  ('00000000-0000-4000-8000-000000000301', 'Notification', 'Actor', 'notification-actor@example.com', 'user', null),
  ('00000000-0000-4000-8000-000000000302', 'Notification', 'Recipient', 'notification-recipient@example.com', 'user', null),
  ('00000000-0000-4000-8000-000000000303', 'Other', 'Recipient', 'notification-other@example.com', 'user', null),
  ('00000000-0000-4000-8000-000000000304', 'Notification', 'Admin', 'notification-admin@example.com', 'admin', null),
  ('00000000-0000-4000-8000-000000000305', 'Archived', 'Recipient', 'notification-archived@example.com', 'user', current_timestamp);

insert into public.projects (
  id,
  owner_id,
  name,
  address,
  google_place_id,
  latitude,
  longitude
)
values (
  '10000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000301',
  'Notification Project',
  '301 Notification Street',
  'notification-place-301',
  -34.6037,
  -58.3816
);

insert into public.project_invitations (
  id,
  project_id,
  invited_email,
  role_code,
  token_hash,
  invited_by,
  expires_at
)
values (
  '20000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000301',
  'notification-recipient@example.com',
  'manager',
  repeat('3', 64),
  '00000000-0000-4000-8000-000000000301',
  '2026-08-07 10:00:00+00'
);

create temporary table notification_test_ids (
  source_event_id text primary key,
  notification_id uuid not null
) on commit drop;

grant select on notification_test_ids to authenticated;

insert into notification_test_ids
values
  (
    '301',
    private.persist_notification(
      'project.collaboration',
      '301',
      'project.invitation_received',
      'project.invitations',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      '20000000-0000-4000-8000-000000000301',
      'project_invitations',
      'Notification Project',
      'Notification Actor',
      null,
      'manager',
      '2026-07-31 10:00:00+00'
    )
  ),
  (
    '302',
    private.persist_notification(
      'project.collaboration',
      '302',
      'project.invitation_accepted',
      'project.invitations',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      '20000000-0000-4000-8000-000000000301',
      'project_team',
      'Notification Project',
      'Notification Actor',
      null,
      'manager',
      '2026-07-31 10:00:00+00'
    )
  ),
  (
    '303',
    private.persist_notification(
      'project.collaboration',
      '303',
      'project.invitation_declined',
      'project.invitations',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      '20000000-0000-4000-8000-000000000301',
      'project_team',
      'Notification Project',
      'Notification Actor',
      null,
      'manager',
      '2026-07-31 10:00:00+00'
    )
  ),
  (
    '304',
    private.persist_notification(
      'project.collaboration',
      '304',
      'project.member_role_changed',
      'project.team_activity',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      null,
      'project_team',
      'Notification Project',
      'Notification Actor',
      'viewer',
      'manager',
      '2026-07-31 09:00:00+00'
    )
  ),
  (
    '305',
    private.persist_notification(
      'project.collaboration',
      '305',
      'project.member_removed',
      'project.team_activity',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      null,
      'none',
      'Notification Project',
      'Notification Actor',
      'manager',
      null,
      '2026-07-31 08:00:00+00'
    )
  ),
  (
    '306',
    private.persist_notification(
      'project.collaboration',
      '306',
      'project.member_left',
      'project.team_activity',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      null,
      'project_team',
      'Notification Project',
      'Notification Actor',
      'manager',
      null,
      '2026-07-31 07:00:00+00'
    )
  ),
  (
    '307',
    private.persist_notification(
      'project.collaboration',
      '307',
      'project.member_removed',
      'project.team_activity',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000303',
      '10000000-0000-4000-8000-000000000301',
      null,
      'none',
      'Notification Project',
      'Notification Actor',
      'manager',
      null,
      '2026-07-31 06:00:00+00'
    )
  );

select is(
  (select count(*) from public.notification_events),
  7::bigint,
  'the trusted boundary accepts all six approved event shapes'
);

select is(
  (select count(*) from public.notifications),
  7::bigint,
  'the trusted boundary creates one recipient row per logical notification'
);

select throws_ok(
  $$
    insert into public.notification_events (
      source_kind,
      source_event_id,
      event_code,
      category_code,
      actor_id,
      project_id,
      destination_kind,
      project_name_snapshot,
      actor_display_name_snapshot
    ) values (
      'project.collaboration',
      'invalid-archived',
      'project.project_archived',
      'project.team_activity',
      '00000000-0000-4000-8000-000000000301',
      '10000000-0000-4000-8000-000000000301',
      'project_team',
      'Notification Project',
      'Notification Actor'
    )
  $$,
  '23514',
  null,
  'excluded event codes cannot be persisted'
);

select throws_ok(
  $$
    select private.persist_notification(
      'project.collaboration',
      '308',
      'project.member_removed',
      'project.invitations',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      null,
      'none',
      'Notification Project',
      'Notification Actor',
      'manager',
      null,
      '2026-07-31 05:00:00+00'
    )
  $$,
  '23514',
  null,
  'an approved event cannot be paired with the wrong category'
);

select throws_ok(
  $$
    select private.persist_notification(
      'project.collaboration',
      '309',
      'project.member_removed',
      'project.team_activity',
      2,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      null,
      'none',
      'Notification Project',
      'Notification Actor',
      'manager',
      null,
      '2026-07-31 05:00:00+00'
    )
  $$,
  '23514',
  null,
  'only notification schema version one is accepted'
);

select is(
  private.persist_notification(
    'project.collaboration',
    'self-suppressed',
    'project.member_removed',
    'project.team_activity',
    1,
    '00000000-0000-4000-8000-000000000302',
    '00000000-0000-4000-8000-000000000302',
    '10000000-0000-4000-8000-000000000301',
    null,
    'none',
    'Notification Project',
    'Notification Recipient',
    'manager',
    null,
    '2026-07-31 05:00:00+00'
  ),
  null::uuid,
  'actor-equals-recipient events are suppressed'
);

select is(
  (
    select count(*)
    from public.notification_events
    where source_event_id = 'self-suppressed'
  ),
  0::bigint,
  'self-suppression does not leave an orphan event'
);

select is(
  private.persist_notification(
    'project.collaboration',
    '301',
    'project.invitation_received',
    'project.invitations',
    1,
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000302',
    '10000000-0000-4000-8000-000000000301',
    '20000000-0000-4000-8000-000000000301',
    'project_invitations',
    'Notification Project',
    'Notification Actor',
    null,
    'manager',
    '2026-08-01 10:00:00+00'
  ),
  (select notification_id from notification_test_ids where source_event_id = '301'),
  'retrying an identical source returns the existing notification'
);

select is(
  (
    select count(*)
    from public.notifications notification
    join public.notification_events event on event.id = notification.event_id
    where event.source_event_id = '301'
  ),
  1::bigint,
  'retrying an identical source does not duplicate the inbox row'
);

update public.notifications
set read_at = '2026-07-31 10:05:00+00'
where id = (
  select notification_id
  from notification_test_ids
  where source_event_id = '301'
);

select is(
  private.persist_notification(
    'project.collaboration',
    '301',
    'project.invitation_received',
    'project.invitations',
    1,
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000302',
    '10000000-0000-4000-8000-000000000301',
    '20000000-0000-4000-8000-000000000301',
    'project_invitations',
    'Notification Project',
    'Notification Actor',
    null,
    'manager'
  ),
  (select notification_id from notification_test_ids where source_event_id = '301'),
  'retrying a read notification returns the same inbox identifier'
);

select is(
  (
    select read_at
    from public.notifications
    where id = (
      select notification_id
      from notification_test_ids
      where source_event_id = '301'
    )
  ),
  '2026-07-31 10:05:00+00'::timestamptz,
  'retrying notification persistence does not reset read state'
);

update public.notifications
set read_at = null
where id = (
  select notification_id
  from notification_test_ids
  where source_event_id = '301'
);

select throws_ok(
  $$
    select private.persist_notification(
      'project.collaboration',
      '301',
      'project.invitation_received',
      'project.invitations',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      '20000000-0000-4000-8000-000000000301',
      'project_invitations',
      'Changed Project Snapshot',
      'Notification Actor',
      null,
      'manager'
    )
  $$,
  '23505',
  null,
  'conflicting reuse of a source identity is rejected'
);

select ok(
  not has_table_privilege('authenticated', 'public.notification_events', 'INSERT'),
  'authenticated clients cannot insert notification events'
);

select ok(
  not has_table_privilege('authenticated', 'public.notifications', 'INSERT'),
  'authenticated clients cannot assign notification recipients'
);

select ok(
  not has_table_privilege('authenticated', 'public.notifications', 'UPDATE'),
  'authenticated clients cannot update inbox rows directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.notifications', 'DELETE'),
  'authenticated clients cannot delete inbox rows'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'private.persist_notification(text,text,text,text,integer,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz)',
    'EXECUTE'
  ),
  'the trusted persistence function is unavailable to authenticated clients'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.list_my_notifications(integer,timestamptz,uuid)',
    'EXECUTE'
  ),
  'anonymous clients cannot list notifications'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.list_my_notifications(integer,timestamptz,uuid)',
    'EXECUTE'
  ),
  'authenticated clients can execute the recipient-scoped inbox API'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000302', true);

select is(
  (select count(*) from public.notifications),
  6::bigint,
  'a normal recipient can read only their own active inbox rows'
);

select is(
  (select count(*) from public.notification_events),
  6::bigint,
  'a normal recipient can read only events linked to their active inbox'
);

select is(
  public.get_my_notification_unread_count(),
  6::bigint,
  'the unread count is recipient-scoped'
);

select is(
  jsonb_array_length(public.list_my_notifications(2, null, null) -> 'items'),
  2,
  'the inbox API returns the requested bounded page size'
);

select is(
  (
    select array_agg(item ->> 'id' order by ordinal)
    from jsonb_array_elements(
      public.list_my_notifications(2, null, null) -> 'items'
    ) with ordinality as page(item, ordinal)
  ),
  (
    select array_agg(id::text order by created_at desc, id desc)
    from (
      select id, created_at
      from public.notifications
      where recipient_id = '00000000-0000-4000-8000-000000000302'
        and archived_at is null
      order by created_at desc, id desc
      limit 2
    ) expected
  ),
  'newest-first pagination uses the UUID tie-breaker deterministically'
);

select ok(
  (public.list_my_notifications(2, null, null) ->> 'has_more')::boolean,
  'the first inbox page reports that another page exists'
);

select is(
  (
    with first_page as (
      select public.list_my_notifications(2, null, null) as result
    ),
    second_page as (
      select public.list_my_notifications(
        2,
        (result -> 'next_cursor' ->> 'created_at')::timestamptz,
        (result -> 'next_cursor' ->> 'id')::uuid
      ) as result
      from first_page
    )
    select count(*)
    from first_page,
      second_page,
      jsonb_array_elements(first_page.result -> 'items') first_item,
      jsonb_array_elements(second_page.result -> 'items') second_item
    where first_item ->> 'id' = second_item ->> 'id'
  ),
  0::bigint,
  'the returned keyset cursor advances without overlapping rows'
);

select throws_ok(
  $$select public.list_my_notifications(20, current_timestamp, null)$$,
  '22023',
  null,
  'a partial inbox cursor is rejected'
);

select ok(
  public.mark_notification_read(
    (select notification_id from notification_test_ids where source_event_id = '301')
  ) is not null,
  'a recipient can mark one active notification as read'
);

select is(
  public.mark_notification_read(
    (select notification_id from notification_test_ids where source_event_id = '301')
  ),
  (
    select read_at
    from public.notifications
    where id = (
      select notification_id
      from notification_test_ids
      where source_event_id = '301'
    )
  ),
  'mark-one preserves the first read timestamp'
);

select is(
  public.mark_notification_read(
    (select notification_id from notification_test_ids where source_event_id = '307')
  ),
  null::timestamptz,
  'a recipient cannot mark another user notification as read'
);

select is(
  public.mark_all_my_notifications_read(),
  5,
  'mark-all atomically updates only the remaining active unread rows'
);

select is(
  public.get_my_notification_unread_count(),
  0::bigint,
  'mark-all settles the recipient unread count at zero'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000303', true);

select is(
  (select count(*) from public.notifications),
  1::bigint,
  'another user sees only their own inbox row'
);

select is(
  public.get_my_notification_unread_count(),
  1::bigint,
  'one user read mutations do not affect another user unread state'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000304', true);

select is(
  (select count(*) from public.notifications),
  7::bigint,
  'a global admin can inspect every active inbox row'
);

select is(
  public.mark_notification_read(
    (select notification_id from notification_test_ids where source_event_id = '307')
  ),
  null::timestamptz,
  'an admin cannot mutate another recipient read state'
);

reset role;

insert into notification_test_ids
values
  (
    'archive-due',
    private.persist_notification(
      'project.collaboration',
      'archive-due',
      'project.member_removed',
      'project.team_activity',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      null,
      'none',
      'Notification Project',
      'Notification Actor',
      'manager',
      null,
      '2026-05-01 10:00:00+00'
    )
  ),
  (
    'purge-due',
    private.persist_notification(
      'project.collaboration',
      'purge-due',
      'project.member_removed',
      'project.team_activity',
      1,
      '00000000-0000-4000-8000-000000000301',
      '00000000-0000-4000-8000-000000000302',
      '10000000-0000-4000-8000-000000000301',
      null,
      'none',
      'Notification Project',
      'Notification Actor',
      'manager',
      null,
      '2026-03-30 10:00:00+00'
    )
  );

select is(
  private.apply_notification_retention('2026-07-31 10:00:00+00', 5000),
  jsonb_build_object(
    'archived_count', 2,
    'purged_count', 1,
    'orphan_event_count', 1
  ),
  'retention archives at 90 days, purges at 120 days, and removes orphan events'
);

select is(
  (
    select archived_at
    from public.notifications
    where id = (
      select notification_id
      from notification_test_ids
      where source_event_id = 'archive-due'
    )
  ),
  '2026-07-30 10:00:00+00'::timestamptz,
  'retention records the deterministic 90-day archive timestamp'
);

select is(
  (
    select count(*)
    from public.notification_events
    where source_event_id = 'purge-due'
  ),
  0::bigint,
  'purged notifications leave no notification event behind'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000302', true);

select is(
  (
    select count(*)
    from public.notifications
    where id = (
      select notification_id
      from notification_test_ids
      where source_event_id = 'archive-due'
    )
  ),
  0::bigint,
  'archived notifications are excluded from normal recipient reads'
);

reset role;

select is(
  (
    select schedule
    from cron.job
    where jobname = 'notifications-retention-daily'
  ),
  '15 3 * * *',
  'the notification retention job is scheduled daily at 03:15 UTC'
);

select * from finish();
rollback;
