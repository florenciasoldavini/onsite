-- Keep the invitation actor variable distinct from collaboration-event columns.
create or replace function private.create_project_invitation(
  p_project_id uuid,
  p_email text,
  p_role_code text,
  p_token_hash text,
  p_expires_at timestamptz,
  p_language_code text
)
returns public.project_invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := (select auth.uid());
  normalized_email text := lower(trim(p_email));
  result public.project_invitations;
begin
  if current_actor_id is null or not private.current_user_has_project_permission(
    p_project_id,
    'project.members.manage'
  ) then
    raise exception 'You cannot invite members to this project.'
      using errcode = '42501';
  end if;

  perform private.assert_assignable_project_role(p_role_code);

  if p_language_code not in ('es', 'en') then
    raise exception 'The invitation language is invalid.' using errcode = '22023';
  end if;

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
    where events.actor_id = current_actor_id
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
    expires_at,
    language_code
  )
  values (
    p_project_id,
    normalized_email,
    p_role_code,
    p_token_hash,
    current_actor_id,
    p_expires_at,
    p_language_code
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
    current_actor_id,
    result.id,
    p_role_code
  );

  return result;
end;
$$;
