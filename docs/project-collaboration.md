# Project Collaboration

Purpose: product and engineering contract for project roles, capabilities, memberships, and invitations
Source of truth for: project-level authorization, collaboration lifecycle, and invitation delivery
Update when: project capabilities, seeded roles, collaboration workflows, or invitation security changes
Last reviewed: 2026-07-31

## Authorization Model

Project authorization is database-owned. `project_roles`, `project_permissions`, and `project_role_permissions` are the canonical catalogs. The initial assignable roles are `manager`, `contributor`, and `viewer`; `owner` is derived from `projects.owner_id` and is never persisted as a membership.

`private.current_user_has_project_permission(project_id, permission_code)` is the authorization engine used by project, client, task, photo, document, and Storage RLS as well as collaboration mutations. It rejects archived projects and removed memberships. Global admins receive every cataloged capability. `public.get_project_access` exposes only the effective role and capability list required by the application.

The client consumes access through `useProjectAccess(projectId).can(permission)`. UI code must not branch on project role names. UI checks improve clarity, while RLS and database workflows remain authoritative.

Role codes are validated stable strings rather than a closed application enum. Add or retire roles and change permission mappings through reviewed migrations. Adding a new capability also requires the affected backend boundary and UI surface to consume it.

## Initial Capability Mapping

| Capability                | Owner | Manager | Contributor | Viewer |
| ------------------------- | ----: | ------: | ----------: | -----: |
| `project.read`            |   Yes |     Yes |         Yes |    Yes |
| `project.update`          |   Yes |     Yes |          No |     No |
| `project.change_client`   |   Yes |      No |          No |     No |
| `project.delete`          |   Yes |      No |          No |     No |
| `project.cover.write`     |   Yes |     Yes |          No |     No |
| `project.tasks.write`     |   Yes |     Yes |         Yes |     No |
| `project.photos.write`    |   Yes |     Yes |         Yes |     No |
| `project.documents.write` |   Yes |     Yes |          No |     No |
| `project.members.read`    |   Yes |     Yes |         Yes |    Yes |
| `project.members.manage`  |   Yes |      No |          No |     No |

## Membership and Invitation Lifecycle

- There is at most one active membership per project/user and one pending invitation per project/normalized email.
- Removed memberships and resolved invitations are retained for trusted audit history.
- Owners and ownership cannot be assigned, transferred, removed, or represented by a membership.
- Members may leave. Owners manage invitations, role changes, revocation, and removal.
- Archiving a project atomically revokes pending invitations and removes active memberships.
- Collaboration mutations are atomic database functions that assert capability codes. The Edge Function validates transport/auth concerns and delegates authorization to those functions.
- Team and invitation inbox reads are bounded to 50 records per page with deterministic ordering.

The collaboration event log is the future trusted source for the selected notification events defined in the [notification contract](notifications.md). That contract is approved but not implemented. Only its explicit initial event matrix may produce notifications; raw table changes and the remaining collaboration event types must not be exposed as notifications automatically.

## Invitation Security

Invitation tokens contain 256 bits of randomness. Only the SHA-256 hash is stored. Email links place the raw token in the URL fragment at `/invitations/accept#token=…`, so it is not included in HTTP paths or referrers.

The public preview discloses only the invitation ID, project name, inviter display name, proposed role, status, and expiry. Acceptance requires an authenticated, verified email matching the normalized invited email.

Invitations expire after seven days. Resend rotates the token, restarts expiry, uses a delivery-version idempotency key, enforces a 60-second cooldown, and shares a 20-email rolling 24-hour actor cap with new invitations. A provider failure leaves the invitation pending with failed delivery state so it can be resent safely.

Each invitation persists a required `language_code` of `es` or `en`. The form
defaults to the sender's active UI language, while every resend reuses the
persisted recipient language. Email role labels are translated from stable role
codes; database English display labels are not email copy.

## Data Access Effects

- Project, linked-client, task, project-photo, project-document, cover, photo-object, and document-object access uses the central capability engine.
- Project, photo, and document repositories rely on RLS for owner/member/admin scope and do not add owner-only filters.
- Product get/list queries continue to exclude soft-deleted rows.
- Project cover, photo, and document signed URLs expire after five minutes to bound stale access after revocation.

## Verification

- `supabase/tests/project_collaboration_rls.test.sql` verifies the seeded mapping, owner/admin/member/removed/outsider/archive resolution, RLS, and the one-row mapping regression.
- `supabase/functions/tests/project-collaboration.test.ts` verifies token hashing, input validation, safe database error mapping, localization, and fragment-based email links.
- Jest covers access parsing, dynamic role codes, `can(permission)`, repository scope, and affected UI behavior.
