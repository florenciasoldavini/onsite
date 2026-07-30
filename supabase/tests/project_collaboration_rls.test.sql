begin;

create extension if not exists pgtap with schema extensions;

select plan(46);

select is(
  (select count(*) from public.project_roles),
  4::bigint,
  'the initial project role catalog is seeded'
);

select is(
  (select count(*) from public.project_permissions),
  10::bigint,
  'the project capability catalog is seeded'
);

select is(
  (
    select array_agg(permission_code order by permission_code)
    from public.project_role_permissions
    where role_code = 'owner'
  ),
  array[
    'project.change_client',
    'project.cover.write',
    'project.delete',
    'project.documents.write',
    'project.members.manage',
    'project.members.read',
    'project.photos.write',
    'project.read',
    'project.tasks.write',
    'project.update'
  ]::text[],
  'owners have every seeded project capability'
);

select is(
  (
    select array_agg(permission_code order by permission_code)
    from public.project_role_permissions
    where role_code = 'manager'
  ),
  array[
    'project.cover.write',
    'project.documents.write',
    'project.members.read',
    'project.photos.write',
    'project.read',
    'project.tasks.write',
    'project.update'
  ]::text[],
  'manager capabilities match the product contract'
);

select is(
  (
    select array_agg(permission_code order by permission_code)
    from public.project_role_permissions
    where role_code = 'contributor'
  ),
  array[
    'project.members.read',
    'project.photos.write',
    'project.read',
    'project.tasks.write'
  ]::text[],
  'contributor capabilities match the product contract'
);

select is(
  (
    select array_agg(permission_code order by permission_code)
    from public.project_role_permissions
    where role_code = 'viewer'
  ),
  array['project.members.read', 'project.read']::text[],
  'viewer capabilities are read-only'
);

insert into public.users (id, first_name, email, role)
values
  ('00000000-0000-4000-8000-000000000101', 'Owner', 'collab-owner@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000102', 'Manager', 'collab-manager@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000103', 'Contributor', 'collab-contributor@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000104', 'Viewer', 'collab-viewer@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000105', 'Removed', 'collab-removed@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000106', 'Outside', 'collab-outside@example.com', 'user'),
  ('00000000-0000-4000-8000-000000000107', 'Admin', 'collab-admin@example.com', 'admin'),
  ('00000000-0000-4000-8000-000000000108', 'Invitee', 'collab-invitee@example.com', 'user');

insert into public.projects (
  id,
  owner_id,
  name,
  address,
  google_place_id,
  latitude,
  longitude,
  deleted_at
)
values
  (
    '10000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000101',
    'Collaboration Project',
    '101 Collaboration Street',
    'collaboration-place-101',
    -34.60,
    -58.38,
    null
  ),
  (
    '10000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000101',
    'Archived Collaboration Project',
    '102 Collaboration Street',
    'collaboration-place-102',
    -34.61,
    -58.39,
    current_timestamp
  );

insert into public.project_memberships (
  id,
  project_id,
  user_id,
  role_code,
  invited_by,
  removed_at,
  removed_by
)
values
  (
    '20000000-0000-4000-8000-000000000102',
    '10000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000102',
    'manager',
    '00000000-0000-4000-8000-000000000101',
    null,
    null
  ),
  (
    '20000000-0000-4000-8000-000000000103',
    '10000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000103',
    'contributor',
    '00000000-0000-4000-8000-000000000101',
    null,
    null
  ),
  (
    '20000000-0000-4000-8000-000000000104',
    '10000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000104',
    'viewer',
    '00000000-0000-4000-8000-000000000101',
    null,
    null
  ),
  (
    '20000000-0000-4000-8000-000000000105',
    '10000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000105',
    'manager',
    '00000000-0000-4000-8000-000000000101',
    current_timestamp,
    '00000000-0000-4000-8000-000000000101'
  );

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000101',
  true
);
select ok(
  private.current_user_has_project_permission(
    '10000000-0000-4000-8000-000000000101',
    'project.read'
  ),
  'the project owner can read'
);
select ok(
  private.current_user_has_project_permission(
    '10000000-0000-4000-8000-000000000101',
    'project.delete'
  ),
  'the project owner can archive'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
select ok(private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.update'), 'a manager can update project fields');
select ok(not private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.delete'), 'a manager cannot archive the project');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000103', true);
select ok(private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.photos.write'), 'a contributor can write photos');
select ok(not private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.update'), 'a contributor cannot update project fields');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000104', true);
select ok(private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.read'), 'a viewer can read');
select ok(not private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.photos.write'), 'a viewer cannot write photos');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000107', true);
select ok(private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.delete'), 'a global admin receives every capability');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000106', true);
select ok(not private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.read'), 'an outsider has no project access');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000105', true);
select ok(not private.current_user_has_project_permission('10000000-0000-4000-8000-000000000101', 'project.read'), 'a removed member has no project access');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
select ok(not private.current_user_has_project_permission('10000000-0000-4000-8000-000000000102', 'project.read'), 'an archived project grants no access');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
select is(
  public.get_project_access('10000000-0000-4000-8000-000000000101') ->> 'role',
  'manager',
  'the safe access result exposes the effective role'
);
select ok(
  (public.get_project_access('10000000-0000-4000-8000-000000000101') -> 'permissions') ? 'project.update',
  'the safe access result exposes capability codes'
);
select is(
  (select count(*) from public.project_roles where is_assignable and retired_at is null),
  3::bigint,
  'role options exclude the owner'
);
select throws_ok(
  $$select private.assert_assignable_project_role('owner')$$,
  '22023',
  null,
  'the owner role cannot be assigned as a membership'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-4000-8000-000000000101',
    'email', 'collab-owner@example.com',
    'role', 'authenticated'
  )::text,
  true
);
select lives_ok(
  $$
    select public.create_project_invitation(
      '10000000-0000-4000-8000-000000000101',
      ' Collab-Invitee@Example.com ',
      'manager',
      repeat('a', 64),
      current_timestamp + interval '7 days',
      'en'
    )
  $$,
  'the owner can atomically create an invitation'
);
select is(
  (
    select language_code
    from public.project_invitations
    where token_hash = repeat('a', 64)
  ),
  'en',
  'the selected invitation language is persisted'
);
select throws_ok(
  $$
    select public.create_project_invitation(
      '10000000-0000-4000-8000-000000000101',
      'invalid-language@example.com',
      'viewer',
      repeat('e', 64),
      current_timestamp + interval '7 days',
      'pt'
    )
  $$,
  '22023',
  null,
  'unsupported invitation languages are rejected'
);
select is(
  (
    select status::text
    from public.project_invitations
    where invited_email = 'collab-invitee@example.com'
  ),
  'pending',
  'a created invitation remains pending until response'
);
select is(
  (
    select invited_email
    from public.project_invitations
    where token_hash = repeat('a', 64)
  ),
  'collab-invitee@example.com',
  'invitation email addresses are normalized in the database'
);
select throws_ok(
  $$
    select public.create_project_invitation(
      '10000000-0000-4000-8000-000000000101',
      'other-invitee@example.com',
      'owner',
      repeat('b', 64),
      current_timestamp + interval '7 days',
      'es'
    )
  $$,
  '22023',
  null,
  'the owner role cannot be assigned through invitation workflows'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000106', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-4000-8000-000000000106',
    'email', 'collab-outside@example.com',
    'role', 'authenticated'
  )::text,
  true
);
select throws_ok(
  $$
    select public.create_project_invitation(
      '10000000-0000-4000-8000-000000000101',
      'outsider-target@example.com',
      'viewer',
      repeat('c', 64),
      current_timestamp + interval '7 days',
      'es'
    )
  $$,
  '42501',
  null,
  'an outsider cannot invite project members'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-4000-8000-000000000108',
    'email', 'collab-invitee@example.com',
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000108', true);
select lives_ok(
  $$
    select public.respond_project_invitation(
      (
        select id
        from public.project_invitations
        where token_hash = repeat('a', 64)
      ),
      'accepted'
    )
  $$,
  'the matching invited user can accept'
);
select is(
  (
    select role_code
    from public.project_memberships
    where project_id = '10000000-0000-4000-8000-000000000101'
      and user_id = '00000000-0000-4000-8000-000000000108'
      and removed_at is null
  ),
  'manager',
  'acceptance creates the proposed active membership'
);
select lives_ok(
  $$
    select public.respond_project_invitation(
      (
        select id
        from public.project_invitations
        where token_hash = repeat('a', 64)
      ),
      'accepted'
    )
  $$,
  'repeating an accepted response is idempotent for the same user'
);
select lives_ok(
  $$select public.leave_project('10000000-0000-4000-8000-000000000101')$$,
  'an active member can leave'
);
select ok(
  exists (
    select 1
    from public.project_memberships
    where project_id = '10000000-0000-4000-8000-000000000101'
      and user_id = '00000000-0000-4000-8000-000000000108'
      and removed_at is not null
      and removed_by = user_id
  ),
  'leaving retains an audited removed membership'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-4000-8000-000000000101',
    'email', 'collab-owner@example.com',
    'role', 'authenticated'
  )::text,
  true
);
select lives_ok(
  $$
    select public.create_project_invitation(
      '10000000-0000-4000-8000-000000000101',
      'cooldown@example.com',
      'viewer',
      repeat('d', 64),
      current_timestamp + interval '7 days',
      'es'
    )
  $$,
  'the owner can create another pending invitation'
);
select lives_ok(
  $$
    select public.set_project_invitation_delivery(
      (
        select id
        from public.project_invitations
        where token_hash = repeat('d', 64)
      ),
      1,
      'sent'
    )
  $$,
  'delivery state can be recorded atomically'
);
select throws_ok(
  $$
    select public.resend_project_invitation(
      (
        select id
        from public.project_invitations
        where token_hash = repeat('d', 64)
      ),
      repeat('e', 64),
      current_timestamp + interval '7 days'
    )
  $$,
  'P0001',
  null,
  'the database enforces the resend cooldown'
);
select lives_ok(
  $$
    select public.revoke_project_invitation(
      (
        select id
        from public.project_invitations
        where token_hash = repeat('d', 64)
      )
    )
  $$,
  'the owner can revoke a pending invitation'
);
select is(
  (
    select status::text
    from public.project_invitations
    where token_hash = repeat('d', 64)
  ),
  'revoked',
  'revocation is retained as a terminal invitation state'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-4000-8000-000000000102',
    'email', 'collab-manager@example.com',
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
set local role authenticated;
select is(
  (select count(*) from public.projects where id = '10000000-0000-4000-8000-000000000101'),
  1::bigint,
  'project RLS admits an active member through the capability engine'
);
select lives_ok(
  $$update public.projects set description = 'Manager edit' where id = '10000000-0000-4000-8000-000000000101'$$,
  'project RLS permits a manager update'
);

reset role;
delete from public.project_role_permissions
where role_code = 'manager' and permission_code = 'project.update';
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-4000-8000-000000000102',
    'email', 'collab-manager@example.com',
    'role', 'authenticated'
  )::text,
  true
);
select pass('one canonical role-permission row was changed');
select ok(
  not private.current_user_has_project_permission(
    '10000000-0000-4000-8000-000000000101',
    'project.update'
  ),
  'the authorization result immediately reflects a mapping change'
);

set local role authenticated;
select throws_ok(
  $$update public.projects set description = 'Blocked manager edit' where id = '10000000-0000-4000-8000-000000000101'$$,
  '42501',
  null,
  'project RLS immediately reflects the same mapping change'
);

reset role;
insert into public.project_role_permissions (role_code, permission_code)
values ('manager', 'project.update');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
select ok(
  private.current_user_has_project_permission(
    '10000000-0000-4000-8000-000000000101',
    'project.update'
  ),
  'restoring the mapping restores authorization'
);

set local role authenticated;
select lives_ok(
  $$update public.projects set description = 'Restored manager edit' where id = '10000000-0000-4000-8000-000000000101'$$,
  'restoring the mapping restores RLS updates'
);

select * from finish();
rollback;
