# Supabase Setup

Purpose: tracked Supabase schema, migration, RLS, Edge Function, and auth URL guidance
Source of truth for: current Supabase bootstrap scope, migration expectations, Edge Function verification, and direct client-access policy
Update when: migrations, RLS policy, Edge Function runtime or security boundaries, auth redirect configuration, or client data-access rules change
Last reviewed: 2026-07-22

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

The tracked bootstrap started with only the `users` table. Product tables should continue to be added as feature-specific migrations instead of being front-loaded.

## Current RLS strategy

The current frontend talks directly to:

- Supabase Auth
- `public.users`
- `public.projects`
- private Supabase Storage for project cover images

Current policy rules:

- `users` policies are anchored directly to `auth.uid() = users.id`
- feature tables default to owner access for normal users and admin-wide access for `users.role = 'admin'`
- feature RLS policies enforce owner/admin authorization independently from lifecycle state
- every get/list repository query must exclude soft-deleted rows with `deleted_at is null`
- clients may add owner filters for normal users for performance, but RLS remains the real authorization boundary
- product emails can use `users.welcome_email_sent_at` as a non-sensitive idempotency marker, but Edge Functions should own marker writes so client sessions cannot repeatedly trigger the same email

Everything else should be added later with its own schema migration plus its own RLS pass when the app starts reading or writing that table from the client.

## Next policy wave

When the app starts exposing more project data directly from the client, the next tables to policy should likely be:

- `project_participants`
- `photos`
- `todos`
- storage buckets for project photos / receipts

Those policies should use explicit participant or owner rules plus admin-wide support where the product requires it.

## Project storage

- `project-covers` is private.
- Cover paths use `projects/{project_id}/cover/{generated_file_name}`.
- Storage policies should allow only project owners or admins to read, upload, replace, and remove cover images.
- Signed URLs are used for preview display; do not make operational project media globally public by default.

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
