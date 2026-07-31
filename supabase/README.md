# Supabase Setup

Purpose: tracked Supabase schema, migration, RLS, Edge Function, and auth URL guidance
Source of truth for: current Supabase bootstrap scope, migration expectations, Edge Function verification, and direct client-access policy
Update when: migrations, RLS policy, Edge Function runtime or security boundaries, auth redirect configuration, or client data-access rules change
Last reviewed: 2026-07-31

This folder is the starting point for tracked Supabase database changes.

## Included migrations

- `20260510090001_create_users_bootstrap.sql`
  Creates only the auth bootstrap schema: `public.user_role` and `public.users`.
- `20260510090002_enable_users_rls.sql`
  Enables RLS for `public.users` and grants direct client access only to that table.
- `20260703133205_create_projects_feature.sql`
  Creates the first projects feature schema, owner/admin RLS, and private project cover storage policies.
- `20260706191340_add_welcome_email_sent_at_to_users.sql`
  Adds `public.users.welcome_email_sent_at` as the once-per-user marker for the product welcome email.
- `20260725191048_create_trade_categories_catalog.sql`
  Creates and seeds ten stable language-neutral construction expertise codes and adds authenticated read-only RLS.
- `20260726205600_create_clients_catalog.sql` and its follow-up policy migrations
  Create the manager-owned client catalog, project relationship, least-privilege grants, and soft-delete-compatible RLS.
- `20260727154854_create_contractors_catalog.sql`
  Creates the manager-owned contractor contact catalog with least-privilege grants, normalization, owner/admin RLS, and soft deletion.
- `20260727213244_create_project_photos_feature.sql`
  Creates project photo metadata, owner/admin RLS, deterministic gallery indexes, and private immutable full/thumbnail Storage policies.
- `20260729193000_add_project_invitation_language.sql`
  Persists constrained `es | en` invitation delivery language and extends the
  creation RPC so resends remain in the recipient's selected language.
- `20260731160045_create_notification_inbox_persistence.sql`
  Creates trusted notification events and recipient inbox rows, read-only recipient/admin RLS, keyset inbox RPCs, atomic read-state operations, idempotency constraints, and scheduled 90/120-day retention.

The tracked bootstrap started with only the `users` table. Product tables should continue to be added as feature-specific migrations instead of being front-loaded.

## Current RLS strategy

The current frontend talks directly to:

- Supabase Auth
- `public.users`
- `public.projects`
- `public.trade_categories`
- `public.clients`
- `public.contractors`
- `public.project_photos`
- private Supabase Storage for project cover images
- private Supabase Storage for project full images and thumbnails

Current policy rules:

- `users` policies are anchored directly to `auth.uid() = users.id`
- feature tables default to owner access for normal users and admin-wide access for `users.role = 'admin'`
- active system catalog rows are readable by authenticated users, while catalog inserts, updates, and deletes remain unavailable to client roles
- feature RLS policies enforce owner/admin authorization independently from lifecycle state
- every get/list repository query must exclude soft-deleted rows with `deleted_at is null`
- clients may add owner filters for normal users for performance, but RLS remains the real authorization boundary
- product emails can use `users.welcome_email_sent_at` as a non-sensitive idempotency marker, but Edge Functions should own marker writes so client sessions cannot repeatedly trigger the same email
- notification recipients may select only their own active rows and linked events; global admins may inspect all active notification rows, while read-state RPCs always mutate only `auth.uid()`
- notification events and recipients are created only through a private trusted function; authenticated clients receive no direct insert, update, or delete table grants

The read-only notification tables and recipient-scoped notification RPCs are ready for the planned notifications feature, but the current frontend does not consume them yet.

Everything else should be added later with its own schema migration plus its own RLS pass when the app starts reading or writing that table from the client.

## Notification retention

- `notifications-retention-daily` runs through Supabase Cron at 03:15 UTC.
- The private retention routine processes at most 5,000 rows per archive and purge phase.
- Inbox rows are archived at `created_at + 90 days`, excluded from normal reads immediately, and permanently purged at 120 days.
- Orphaned notification events are deleted after their final recipient row is purged; source-domain events remain authoritative history.
- Users and global admins cannot manually archive or delete notification rows.

The trade-categories catalog is intentionally independent from worker persistence. Add the
worker-to-trade-category junction in the workers feature migration only after the
canonical workers table and its ownership rules exist, so the relationship has
a real foreign key and enforceable RLS boundary.

## Next policy wave

When the app starts exposing more project data directly from the client, the next tables to policy should likely be:

- `project_participants`
- `todos`
- storage buckets for receipts

Those policies should use explicit participant or owner rules plus admin-wide support where the product requires it.

## Project storage

- `project-covers` is private.
- Cover paths use `projects/{project_id}/cover/{generated_file_name}`.
- Storage policies should allow only project owners or admins to read, upload, replace, and remove cover images.
- Signed URLs are used for preview display; do not make operational project media globally public by default.

## Project photo storage

- `project-photos` is private and accepts JPEG objects up to 6 MiB each.
- Full and thumbnail objects use immutable paths:
  - `projects/{project_id}/photos/{photo_id}/full.jpg`
  - `projects/{project_id}/photos/{photo_id}/thumbnail.jpg`
- Storage inserts and cleanup require owner/admin project access; object updates are not granted.
- Storage reads require an active `project_photos` row referencing the exact object, so soft-deleted and orphaned objects remain unreadable.
- Photo row ownership and uploader identity are derived in the database rather than trusted from client input.

## Profile avatar storage

- `user-avatars` is public so profile images can be rendered through public object URLs.
- Public delivery does not require broad `select` access to `storage.objects`.
- Authenticated users can select, upload, replace, and delete object metadata only inside `users/{auth.uid()}/avatar/`.
- Keep avatar metadata listing owner-scoped even though the image asset itself is intentionally public.

## Supabase tests

- Database and RLS changes should include pgTAP tests under `supabase/tests/`.
- The committed `supabase/config.toml` makes the local database version and service configuration reproducible.
- Run `npx supabase db start` once to start local Postgres and apply migrations, then run `npx supabase test db` after migrations or policy changes.
- CI starts a clean local Postgres instance and runs the full database test suite on every pull request and on pushes to `development` or `main`; failures block the aggregate `ci-checks` job.
- Tests should cover owner access, admin access, cross-user denial, soft-delete filtering, and storage policy behavior.

## Edge Functions

- Google Maps and other paid/secret external APIs must be called through Supabase Edge Functions or another trusted server boundary.
- Edge Functions must validate request payloads, authenticate user-scoped calls, rate-limit abusive patterns, and avoid persistent third-party content caching unless provider terms allow it.
- Edge Functions use Deno 2.1 with pinned imports and a committed `deno.lock`. Run `npm run functions:verify` to typecheck, lint, and test the complete function surface before deployment.
- User-scoped handlers share typed `auth.getUser()` validation through `_shared/auth.ts`. The helper accepts current publishable-key environment variables and the legacy `SUPABASE_ANON_KEY` fallback; service-role access remains isolated to explicitly privileged workflows.
- Platform JWT verification remains enabled by default, and user-scoped handlers revalidate the bearer token to obtain the authenticated user before processing input or consuming paid API quota.
- Google Maps functions also enforce durable monthly hard caps before calling Google. Defaults are 500 autocomplete calls/month, 100 place-detail calls/month, and 100 static map preview calls/month unless Supabase secrets override them.
- Google Maps address functions store only selected project data such as address, `place_id`, latitude, and longitude.
- The server-side Google Maps key should stay restricted to the APIs used by deployed Edge Functions. Project address lookup currently needs Places API (New), and selected-address map previews need Maps Static API. If a new Edge Function needs another Maps API, update the Google Cloud API key restrictions before releasing that feature. Client map rendering uses a restricted Maps JavaScript API key on web and a restricted Maps SDK for Android key on Android; iOS uses Apple Maps.

### Function verification

Install Deno 2.1, then run:

```bash
npm run functions:check
npm run functions:lint
npm run functions:test
npm run functions:verify
```

The root Expo TypeScript and ESLint configurations intentionally exclude `supabase/functions/`; Deno owns verification for that runtime, and CI enforces the combined verification task.

Current transactional email functions bundle Deno-safe Spanish and English
resources. `auth-send-email` implements the signed Supabase Auth Send Email Hook
and intentionally has JWT verification disabled in `supabase/config.toml`;
Standard Webhooks verification is authoritative. Configure
`SEND_EMAIL_HOOK_SECRET` before activation.

## Auth URL configuration

In Supabase Auth, set:

- `Site URL`: `https://onzait.vercel.app`
- additional redirect URLs for local web: `http://localhost:8081/**` (adjust if Expo web is running on a different port)
- additional redirect URLs for production web paths: `https://onzait.vercel.app/**`
- additional redirect URLs for native app auth:
  - `onzait://callback`
  - `onzait://reset-password`

If you want auth links to work on Vercel preview deploys too, add your preview wildcard once you confirm the account slug. Supabase's current Vercel pattern is:

- `https://*-<your-vercel-account-or-team-slug>.vercel.app/**`

Expo Go uses temporary `exp://.../--/<path>` links instead of the production native scheme. When testing Google or Apple OAuth in Expo Go, add the exact current Expo Go callback URL, such as `exp://<host>:8081/--/callback`, to Supabase Auth redirect URLs. This URL can change with the dev server host or port, so a development build is more reliable for ongoing OAuth testing.

## Pending Launch Setup

Pending auth branding, custom domain, DNS, and branded email setup live in [docs/pending-launch-setup.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/pending-launch-setup.md:1).

## Notes

- Edge Functions may use a service-role path for explicitly privileged operations, so those server-side flows are not blocked by client RLS restrictions. Keep that access narrowly scoped and never expose the key to the client.
- The repo now expects migrations to be applied via the Supabase CLI after linking the project.
