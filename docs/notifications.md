# Notifications

Purpose: product and engineering contract for the Onzait notification system
Source of truth for: notification events, recipients, categories, destinations, content safety, preferences, localization, and retention
Update when: notification producers, categories, recipient rules, destinations, delivery channels, privacy rules, or retention behavior change
Last reviewed: 2026-07-31
Status: inbox persistence, RLS, read state, pagination, and retention are implemented; notification producers, UI, preferences, device registration, and delivery remain planned under [GitHub issue #60](https://github.com/florenciasoldavini/onzait/issues/60)

## Product Direction

Onzait will provide an authenticated in-app notification inbox on web, iOS, and Android. Native push delivery will be an optional companion channel on iOS and Android. Browser push is deferred.

The inbox is the durable user-facing notification channel. Denied, unavailable, or revoked native push permission must never remove inbox access. Notifications communicate selected product events; they are not a copy of raw database changes and are not an audit log.

Initial notification production is limited to the implemented Project Collaboration domain. Task notifications remain deferred until Tasks supports real assignments, comments, and status workflows.

## Implemented Persistence

`public.notification_events` stores immutable semantic event data and the minimum approved snapshots. `public.notifications` stores the recipient relationship, read timestamp, archive timestamp, and stable notification identifier. Neither table stores rendered copy, arbitrary payload JSON, arbitrary URLs, email addresses, invitation tokens, or other operational content.

Stable code constants, application-facing row and normalized inbox types, and Zod parsers live under `features/notifications/constants/`, `features/notifications/types/`, and `features/notifications/schemas/`. They mirror the database event matrix and reject unsupported versions, mismatched category/destination combinations, inconsistent cursors, and unexpected persisted content before it reaches future repositories or UI.

Trusted database workflows will create notifications through `private.persist_notification`. API clients cannot execute that function or insert, update, or delete either table directly. The source pair of `source_kind` and `source_event_id` is unique, and each event-recipient pair is unique. An identical retry returns the existing notification without changing snapshots or read state; conflicting reuse of a source identity fails.

The initial Project Collaboration producer uses `source_kind = project.collaboration` and the stable collaboration event identifier as `source_event_id`. Producer integration remains tracked separately in issue #88.

Authenticated clients have these recipient-scoped operations:

- `list_my_notifications(limit, before_created_at, before_id)` returns a newest-first keyset page ordered by `(created_at, id)`, with a default of 20 and maximum of 50;
- `get_my_notification_unread_count()` counts active unread rows;
- `mark_notification_read(notification_id)` idempotently preserves the first read timestamp;
- `mark_all_my_notifications_read()` atomically marks the recipient's remaining active rows as read.

RLS permits recipients to select only their own active inbox rows and linked events. Global admins may inspect all active notification rows for support, but the read-state operations remain hard-scoped to `auth.uid()` and cannot mutate another recipient's state. Anonymous access is denied.

## Stable Contract

Notification event and category codes are stable dotted strings. Every initial event uses `schema_version: 1`. Persisted UI copy is prohibited: clients render localized copy from the stable event code, schema version, and permitted structured values.

The initial categories are:

- `project.invitations`: invitation receipt and invitation response activity;
- `project.team_activity`: role and membership changes.

The initial event matrix is:

| Event code                    | Source collaboration event | Category                | Recipient                                                                       | Safe snapshot values                                           | Destination                                                                 |
| ----------------------------- | -------------------------- | ----------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `project.invitation_received` | `invited`                  | `project.invitations`   | Existing verified user whose normalized Auth email matches the invitation email | Project name, inviter display name, next role code             | Invitations inbox while the invitation is pending; otherwise non-actionable |
| `project.invitation_accepted` | `accepted`                 | `project.invitations`   | Invitation sender, currently the project owner                                  | Project name, actor display name, next role code               | Project Team while authorized                                               |
| `project.invitation_declined` | `declined`                 | `project.invitations`   | Invitation sender, currently the project owner                                  | Project name, actor display name, next role code               | Project Team while authorized                                               |
| `project.member_role_changed` | `role_changed`             | `project.team_activity` | Affected member                                                                 | Project name, actor display name, previous and next role codes | Project Team while authorized                                               |
| `project.member_removed`      | `removed`                  | `project.team_activity` | Affected member                                                                 | Project name, actor display name, previous role code           | Non-actionable                                                              |
| `project.member_left`         | `left`                     | `project.team_activity` | Project owner                                                                   | Project name, actor display name, previous role code           | Project Team while authorized                                               |

Recipient resolution and notification creation happen only at a trusted database or server boundary. If the actor and resolved recipient are the same user, the event produces no notification.

`resent`, `revoked`, and `project_archived` collaboration events do not produce notifications in the initial release. Resending an invitation does not create a duplicate notification or reset an existing notification to unread. Revoking, accepting, declining, or expiring an invitation makes its original receipt notification non-actionable without creating a replacement event.

An invitation creates an inbox notification only when its normalized email already belongs to an existing verified Supabase Auth user. Invitations for people without such an account continue through invitation email and the existing invitation inbox; signup does not backfill a notification. Account lookup and matching must not disclose whether an email belongs to an Onzait user.

## Destinations and Authorization

Destination kinds are typed product values, not arbitrary paths or URLs:

- `project_invitations` resolves to `/invitations`;
- `project_team` resolves to `/projects/{projectId}/team`;
- `none` is explicitly non-actionable.

The future notification-open flow must load the notification for the authenticated recipient, validate its schema version, resolve the typed destination, and then rely on the destination screen plus database authorization. A destination that is malformed, stale, resolved, removed, deleted, or no longer authorized becomes non-actionable or shows finite unavailable feedback. Notification data must never bypass project capabilities, RLS, route validation, or normal signed-in navigation.

## Content and Privacy

The RLS-protected inbox may retain only the minimum snapshot values needed to keep localized notifications understandable during their retention period:

- project name;
- actor display name;
- stable previous or next project role codes when applicable.

These user-authored names remain verbatim and are never translated. Stable role codes are mapped to localized presentation labels.

Notification records must not retain email addresses, phone numbers, invitation tokens, free-form descriptions, comments, task content, incident or safety details, file contents, object paths, signed URLs, or arbitrary URLs. Diagnostics must use stable identifiers and error categories without notification content or device tokens.

Native push payloads contain only the notification identifier and payload schema version. Lock-screen title and body are generic, localized copy and must not contain project names, actor names, role names, or other operational details. The app fetches the recipient-scoped notification after authenticated open.

## Preferences and Localization

All initial events always remain enabled for the in-app inbox. Users cannot disable, manually archive, or delete individual inbox events in the initial release.

Native push is configurable independently for `project.invitations` and `project.team_activity`. Both category preferences default to enabled after operating-system permission is granted. A missing explicit preference resolves to enabled. Operating-system permission remains authoritative: an enabled product preference cannot override denied, unavailable, or revoked device permission.

Inbox copy renders in the current device-local app language using the established Spanish default and English missing-key fallback. Stored event/category codes and snapshot values remain language-neutral. Future device registration records carry the active `es | en` locale so trusted push delivery can select generic localized copy per device.

## Retention

Notifications remain visible for 90 days from creation. At 90 days they are server-archived, excluded from normal inbox reads and unread counts, and no longer actionable. They are permanently purged 30 days later.

The database runs `private.apply_notification_retention` every day at 03:15 UTC through the `notifications-retention-daily` Supabase Cron job. Each pass archives and purges at most 5,000 rows per phase, records the deterministic archive timestamp as `created_at + 90 days`, and deletes notification events after their final recipient row is purged.

Users do not control this lifecycle in the initial release. Read state does not change retention. The originating domain record and `project_collaboration_events` remain authoritative for operational or audit history after notification purge.

## Delivery and Idempotency Direction

Each logical notification must be unique for its source event and recipient. Duplicate source processing must not create another inbox row or another logical device delivery. External push providers do not provide end-to-end exactly-once display guarantees, so delivery is best effort at that final boundary and must use durable state, bounded retries, receipt reconciliation, and stale-token cleanup when implemented.

Push permission must be requested contextually. The app must explain denied, unavailable, and revoked states with actionable guidance while keeping the inbox usable.

## Deferred Scope

- browser/service-worker web push;
- task assignment, status, comment, and due-date events;
- project archival notifications;
- notification digests, quiet hours, and project-specific overrides;
- user-controlled inbox deletion or archival;
- retroactive invitation notifications after signup;
- notification use as an offline synchronization or audit mechanism.

## Implementation Tracking

- [GitHub issue #89](https://github.com/florenciasoldavini/onzait/issues/89): inbox persistence, RLS, pagination, and read state;
- [GitHub issue #88](https://github.com/florenciasoldavini/onzait/issues/88): Project Collaboration producers;
- [GitHub issue #87](https://github.com/florenciasoldavini/onzait/issues/87): in-app inbox and unread badge;
- [GitHub issue #91](https://github.com/florenciasoldavini/onzait/issues/91): per-user preferences;
- [GitHub issue #86](https://github.com/florenciasoldavini/onzait/issues/86): native device registration and permission lifecycle;
- [GitHub issue #90](https://github.com/florenciasoldavini/onzait/issues/90): native push delivery and receipt handling;
- [GitHub issue #92](https://github.com/florenciasoldavini/onzait/issues/92): push navigation and cross-platform release verification.
