# AGENTS.md

Purpose: architecture snapshot, product decisions, and implementation guardrails for contributors and agents
Source of truth for: current auth architecture, platform decisions, naming rules, and high-level project constraints
Update when: auth flow, platform ownership, schema strategy, CI expectations, or product naming decisions change
Last reviewed: 2026-07-21

## Project Snapshot

- Project name: `onzait`
- Stack: `Expo Router` + `React Native` + `Expo web static export`
- Backend/data direction:
  - the frontend uses Supabase Auth and RLS-protected product tables through repositories
  - Supabase Edge Functions are the trusted server boundary for privileged, secret, paid, or abuse-sensitive workflows
  - introduce another backend only when a concrete product requirement cannot be served safely by this architecture
- Main product goal: mobile-first construction / job-site management app that is also usable in a browser for client feedback

## Source Architecture

- The maintained architecture guide lives in [docs/source-architecture.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/source-architecture.md:1).
- Onzait uses a feature-first source architecture.
- `app/` owns Expo Router route declarations and layouts only. Route files should delegate product UI to feature screens.
- Product domains live under `features/<feature>/`. A feature may own its screens, components, hooks, services, repositories, schemas, types, utilities, errors, providers, constants, maps, and tests.
- Feature roots contain responsibility directories only; place implementation files in the appropriate subdirectory instead of leaving loose modules at the feature root.
- Active features and planned domain contracts use the same ownership rule; do not recreate global `screens`, `hooks`, `services`, `repositories`, `schemas`, `lib`, or `types/models` layers.
- Reusable product-agnostic UI, hooks, utilities, theme helpers, tests, and splash behavior live under `shared/`.
- SDK clients and technical adapters live under `infrastructure/`. Product UI must not import infrastructure or repositories directly.
- Supabase migrations, Edge Functions, and database tests remain under the root `supabase/` directory because they are independently verified and deployed.
- Dependency direction is `app -> feature screen/component -> feature hook/service -> feature repository -> infrastructure`.
- `shared/` must never import from `features/`. Cross-feature imports should use the owning feature's public hook, service, provider, or type rather than its repository internals.

## Current Platform Setup

- Web is deployed on Vercel
  - production URL: `https://onzait.vercel.app`
- Native build/distribution is wired through EAS
  - Expo owner/project: `@florenciasoldavini/onzait`
- Database/auth is on Supabase
- Error monitoring is wired with Sentry

## Platform Product Rule

- Every product feature must work smoothly on all three supported runtime targets: web, iOS, and Android.
- Onzait is mobile-first because it is an on-site construction app and will often be used from phones or tablets, but desktop web must remain a first-class experience for client feedback, admin work, and early launch testing.
- Web is the first launch target because it can be deployed on Vercel without app-store distribution, but implementation choices must not block later iOS and Android releases.
- Use the correct implementation for each environment when a feature needs platform-specific behavior. Prefer shared product logic with platform-specific UI or infrastructure adapters over a lowest-common-denominator workaround.
- UI responsiveness and functional behavior must both be considered across phone, tablet, and desktop layouts before a feature is treated as complete.
- Native builds support portrait and landscape rather than locking orientation. Tablet landscape and iPad multitasking layouts are required product surfaces, and installed web apps must not request a fixed orientation.
- Compact-height landscape layouts must keep primary content and actions reachable. Screens that can overflow vertically must remain scrollable before, during, and after keyboard interaction.
- The approved responsive-to-adaptive UI direction, including compact, medium, and expanded layout classes, lives in [docs/adaptive-layout-strategy.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/adaptive-layout-strategy.md:1).

## Auth Architecture

- Supabase is the source of truth for identity
- `public.users.id` must match `auth.users.id` / `auth.uid()`
- Global role lives in `public.users.role`
- New users default to role `user`
- The first real admin should be promoted manually with SQL after signup
- Do not let the client choose or escalate role values

### Supported Auth Flows

- Email/password
- Google OAuth
- Apple OAuth
- Email verification with resend confirmation link
- Welcome product email after verified first app entry
- Account profile editing
- Google/Apple identity linking from the profile screen
- Password reset
- Shared callback and redirect handling lives in [features/auth/services/auth.service.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/services/auth.service.ts:1)
- Auth screens reach Supabase through `features/auth` hooks, services, and repositories; screen-level imports of the Supabase client or shared auth transport are prohibited by ESLint
- The auth context owns React session/profile state only. Session transport, profile provisioning/backfill, sign-out, and welcome-email workflows live behind `features/auth` services and repositories; context-level Supabase and repository imports are prohibited by ESLint.

### Important Auth Files

- [features/auth/hooks/use-auth-mutations.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/hooks/use-auth-mutations.ts:1)
- [features/auth/hooks/use-auth.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/hooks/use-auth.ts:1)
- [features/auth/services/auth.service.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/services/auth.service.ts:1)
- [features/auth/repositories/auth.repository.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/repositories/auth.repository.ts:1)
- [features/auth/repositories/auth-transport.repository.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/repositories/auth-transport.repository.ts:1)
- [features/auth/services/auth-session.service.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/services/auth-session.service.ts:1)
- [features/auth/repositories/auth-profile.repository.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/repositories/auth-profile.repository.ts:1)
- [features/auth/providers/auth-provider.tsx](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/providers/auth-provider.tsx:1)
- [infrastructure/supabase/client.ts](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/infrastructure/supabase/client.ts:1)
- [app/\_layout.tsx](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/app/_layout.tsx:1)
- [app/(auth)/callback.tsx](</Users/florenciasoldavini/Documents/Projects/OnSite/on-site/app/(auth)/callback.tsx:1>)
- [app/(auth)/verify-email.tsx](</Users/florenciasoldavini/Documents/Projects/OnSite/on-site/app/(auth)/verify-email.tsx:1>)
- [features/auth/screens/sign-in-screen.tsx](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/screens/sign-in-screen.tsx:1)
- [features/auth/screens/sign-up-screen.tsx](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/screens/sign-up-screen.tsx:1)
- [features/auth/screens/verify-email-screen.tsx](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/screens/verify-email-screen.tsx:1)
- [features/auth/screens/reset-password-screen.tsx](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/auth/screens/reset-password-screen.tsx:1)
- [features/profile/screens/profile-screen.tsx](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/features/profile/screens/profile-screen.tsx:1)

### Auth Gotchas

- Do not manually force `router.replace("/")` immediately after sign-in unless you are sure auth state has already settled
- The current route guard is session-driven in [app/\_layout.tsx](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/app/_layout.tsx:43)
- Web redirect URLs should use the current browser origin when available; hosted fallback comes from `EXPO_PUBLIC_SITE_URL`
- Native auth redirects use `onzait://` in development/production builds
- Expo Go auth redirects use the current `exp://.../--/<path>` callback and must be allow-listed in Supabase while testing OAuth there
- Identity-linking redirects return through the shared callback and may include a safe in-app `next` path such as `/profile`
- Hosted Supabase Auth must keep **Allow manual linking** enabled for the Google/Apple profile actions; local/self-hosted testing uses `auth.enable_manual_linking`
- Callback metadata identifies a linking attempt but is not proof of success; the profile must confirm the provider through `getUserIdentities()` before reporting it as linked
- Email/password sign-in with an unverified email should route to `/verify-email` instead of showing a form error
- Verification email rate limits should be represented as a disabled resend countdown, not as a blocking error message

## Supabase Decisions

- We intentionally simplified the initial schema bootstrap to `users` only
- Do not front-load the entire product schema
- Add new tables as feature-specific migrations when each feature is actually built

### Current Tracked Supabase Migrations

- [20260510090001_create_users_bootstrap.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260510090001_create_users_bootstrap.sql:1)
- [20260510090002_enable_users_rls.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260510090002_enable_users_rls.sql:1)
- [20260706191340_add_welcome_email_sent_at_to_users.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260706191340_add_welcome_email_sent_at_to_users.sql:1)
- [20260725191048_create_trade_categories_catalog.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260725191048_create_trade_categories_catalog.sql:1)
- [20260726205600_create_clients_catalog.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260726205600_create_clients_catalog.sql:1)
- [20260727150428_restrict_clients_table_grants.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260727150428_restrict_clients_table_grants.sql:1)
- [20260727152922_allow_client_soft_delete_updates.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260727152922_allow_client_soft_delete_updates.sql:1)
- [20260727154854_create_contractors_catalog.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260727154854_create_contractors_catalog.sql:1)
- [20260727173645_create_workers_catalog.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260727173645_create_workers_catalog.sql:1)
- [20260727181524_align_directory_active_select_policies.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260727181524_align_directory_active_select_policies.sql:1)
- [20260727181533_create_suppliers_catalog.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260727181533_create_suppliers_catalog.sql:1)
- [20260727191057_allow_directory_soft_delete_updates.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260727191057_allow_directory_soft_delete_updates.sql:1)
- [20260727213244_create_project_photos_feature.sql](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/supabase/migrations/20260727213244_create_project_photos_feature.sql:1)

### RLS Baseline

- `public.users` is the auth profile table and `public.projects` is the first product feature table
- Feature tables must default to owner-scoped access for normal users and admin-wide access for `users.role = 'admin'`
- Admin users should see all non-deleted rows for feature tables unless a feature documents a narrower rule
- Normal users should see only their own rows unless a feature explicitly introduces participant access
- All get/list reads must filter out rows where `deleted_at` is not null
- Owner/admin `SELECT` policies may retain access to archived owner-scoped rows when PostgreSQL requires that visibility for direct RLS-protected soft-deletion updates; archived-row exclusion remains mandatory in every product get/list query
- Policies are anchored to `auth.uid()` plus trusted database role checks, not client-only role checks
- Insert policies must prevent clients from assigning privileged ownership, membership, or role values
- Update policies must preserve ownership/role invariants and use both `USING` and `WITH CHECK` where ownership could change
- System reference catalogs are an explicit exception to owner-scoped feature data: authenticated clients may read active catalog rows, but catalog writes remain unavailable to client roles

### Migration Gotcha

- Supabase migration filenames must use unique full timestamps
- Do not create multiple migration files that collapse to the same parsed version prefix
- The earlier `20260509_...` naming caused a remote `schema_migrations` collision

### Trade Categories Catalog

- `public.trade_categories` is the only trade-related catalog for now; there is no `public.trades` table or trade entity
- the catalog contains the ten fixed construction expertise categories
- add or retire catalog entries through tracked database migrations
- authenticated users may read non-deleted trade categories but cannot create, edit, or delete catalog rows
- catalog records store only a stable language-neutral code; localized names, descriptions, and display order belong in the presentation/i18n layer
- obsolete entries should be soft-deleted so future worker history can retain valid references
- worker expertise will link workers directly to trade categories when the workers feature defines its persisted ownership model; do not create that junction without a foreign key to the canonical workers table

### Clients Catalog

- clients are manager-owned contact records and do not have Supabase Auth identities or app login access
- each project may reference one optional active client, while one client may be linked to multiple projects
- a project and its client must have the same owner; database triggers enforce this relationship and reject archived clients
- normal users can manage only their own clients, while admins may read and update all active client records
- deleting a client means soft deletion after explicit confirmation; linked active projects are atomically unlinked
- client catalog, picker, and linked-project queries must remain paginated and exclude soft-deleted records

### Contractors Catalog

- contractors are manager-owned contact records and do not have Supabase Auth identities or app login access
- contractor records contain a required first name plus optional last name, phone number, and email; initials are presentation-only and there is no contractor avatar storage
- normal users can manage only their own contractors, while admins may read and update all active contractor records
- deleting a contractor means soft deletion after explicit confirmation
- contractor lists must remain paginated and exclude soft-deleted records
- worker assignment, trade expertise, project relationships, import/export, and duplicate detection remain deferred
- clients and contractors share the Directory navigation destination but retain separate feature ownership, persistence, queries, and forms

### Workers Catalog

- workers are manager-owned contact records and do not have Supabase Auth identities or app login access
- worker records contain a required first name plus optional last name, phone number, and email; worker avatars are deferred
- a worker may reference one optional active contractor owned by the same manager; archiving that contractor automatically unlinks the worker without deleting them
- a worker may reference zero or more active entries from the canonical `trade_categories` catalog to describe the work they usually perform
- worker contact and relationship changes are saved atomically through RLS-protected security-invoker database functions
- normal users can manage only their own workers, while admins may read and update all active worker records without transferring ownership or linking records across owners
- deleting a worker means soft deletion after explicit confirmation; worker lists remain paginated and exclude soft-deleted records
- project assignments, payment contracts, imports, duplicate detection, and worker login identities remain deferred
- clients, contractors, and workers share the Directory navigation destination but retain separate feature ownership, persistence, queries, and forms

### Suppliers Catalog

- suppliers are manager-owned business records and do not have Supabase Auth identities or app login access
- supplier name is required; contact name, phone number, email, website, Google-selected address, and notes are optional
- supplier addresses persist the formatted address, Google place ID, latitude, and longitude as one atomic optional bundle
- normal users can manage only their own suppliers, while admins may read and update all active supplier records without transferring ownership
- deleting a supplier means soft deletion after explicit confirmation; supplier lists remain paginated and exclude soft-deleted records
- opening hours, multiple contacts, material categories, project relationships, purchasing, tax identifiers, imports, duplicate detection, and supplier avatars remain deferred
- clients, contractors, workers, and suppliers share the Directory navigation destination but retain separate feature ownership, persistence, queries, and forms

### Project Photos

- project photos are private, project-owned operational records; normal users manage only photos in their own active projects and admins may manage all active project photos
- each photo keeps one operational category plus an independent marketing flag; marketing classification does not publish the photo or imply consent
- uploads normalize selected images to JPEG full and thumbnail variants and never retain the original file
- Apple HEIC/HEIF input is converted automatically, including on web
- capture time and optional coordinates come only from existing photo EXIF in this version; the app does not request device location for photo upload
- generated JPEG objects contain no retained EXIF, while selected EXIF coordinates remain in the RLS-protected database row for future project-assignment assistance
- photo rows are soft-deleted before Storage cleanup; active row references are required for Storage reads
- the complete product, privacy, processing, and deferred-scope contract lives in [docs/project-photos.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/project-photos.md:1)

## User Model Decisions

- `users.id`: UUID from Supabase Auth
- `users.email`: unique, normalized to lowercase in app code
- `users.last_name`: nullable
- `users.role`: enum-like DB type `user_role` with values `admin | user`
- `users.welcome_email_sent_at`: nullable timestamp set after the welcome product email is sent

## Environment Workflow

- `.env.local` is the local source of truth for real secrets
- `.env.example` is generated, not hand-maintained
- env metadata and sync targets live in [env-sync.config.json](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/env-sync.config.json:1)
- When a feature introduces a new key or env var, add it to `env-sync.config.json`, regenerate `.env.example`, and add an easy-to-replace placeholder in `.env.local` for local setup.
- the current performance baseline lives in [docs/performance-baseline.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/performance-baseline.md:1)
- the current SEO and accessibility baseline lives in [docs/seo-accessibility-baseline.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/seo-accessibility-baseline.md:1)
- the current security baseline for MVP feature work lives in [docs/security-baseline.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/security-baseline.md:1)
- the current user-facing error baseline lives in [docs/error-handling.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/error-handling.md:1)
- pending launch setup for custom domain, auth branding, DNS, and branded email lives in [docs/pending-launch-setup.md](/Users/florenciasoldavini/Documents/Projects/OnSite/on-site/docs/pending-launch-setup.md:1)

### Useful Commands

- `npm run env:example`
- `npm run env:check`
- `npm run sync:env`
- `npm run sync:env -- --dry-run`
- `ggshield secret scan pre-commit`
- `npm test`
- `npm run test:watch`
- `npx supabase test db`

## CI / Verification

- CI currently checks:
  - `npm run env:check`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run build`
  - `npm test`
  - `npm run functions:verify`
  - `supabase db start` followed by `supabase test db`
  - pull requests targeting `development` or `main` are reviewed for newly introduced high- or critical-severity dependency vulnerabilities
- Dependabot checks the root app dependencies monthly, groups compatible minor/patch updates, limits open update PRs, and targets routine version updates to `development`
- Dependabot security alerts and security-update PRs follow GitHub's default-branch behavior and therefore target `main`

### Useful Local Checks

- `npx tsc --noEmit`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm run functions:verify`
- `npx supabase test db`

## Feature Implementation Rules

- Every feature must include appropriate tests for the work: unit tests for reusable logic, database/RLS tests for Supabase access rules, and flow/UI tests for user-critical behavior.
- Every feature must explicitly account for web, iOS, and Android behavior. If the correct implementation differs by platform, use platform-specific files or adapters while keeping the business logic shared.
- When adding a new project rule or product constraint, scan existing features, docs, env config, and tests for places where the rule already applies. Refactor, document follow-up work, or clearly call out any existing gap instead of applying the rule only to future code.
- Every async surface must handle loading explicitly with an appropriate spinner, skeleton, disabled state, optimistic state, or other clear indicator.
- Every error visible to a user must use clear, actionable product language. Never render raw provider, database, HTTP, SDK, or exception messages. Branch on stable error codes or structured status fields, preserve the technical cause for trusted diagnostics, use an action-specific fallback for unknown failures, distinguish query failures from empty/not-found results, provide safe retry actions, and explain denied device permissions instead of stopping silently. Follow `docs/error-handling.md`.
- Every request that lists or "gets all" records from an entity must be paginated at the repository/transport boundary. Unbounded collection reads are prohibited, including map, export, admin, and background workflows. Use a bounded default and maximum page size, deterministic ordering with a stable unique tie-breaker, summary-only columns for list screens, and virtualized or progressively rendered collection UI. Single-record lookups are exempt.
- Every destructive action that deletes persistent project or account data must require an explicit confirmation modal before the mutation runs. The modal must identify what will be deleted, provide distinct Cancel and danger-styled Delete actions, prevent repeat submission while pending, and keep mutation errors visible without closing.
- Production submit forms must use `react-hook-form` with a Zod schema resolver. Keep form values, validation errors, validity, submission state, and edit dirty-state in the form controller rather than duplicating them with local `useState`.
- Local component state is only for transient UI-only behavior such as password visibility, picker/popover open state, autocomplete session state, and non-submit search/filter fields.
- Form submit buttons must stay disabled until every required input is complete. When a form mixes required and optional fields, use one label convention only: optional fields show the shared discreet `(optional)` hint, and required fields are left unmarked.
- Use the dependency direction `screens/components -> hooks -> services -> repositories -> Supabase/Storage/Edge Functions`.
- UI components should not call Supabase, Storage, Google, or other external services directly; use feature hooks.
- Hooks should own React Query/cache behavior only and call feature services for workflows.
- Services should own product/business workflows and orchestration.
- Repositories should own raw persistence or external transport calls only.
- External APIs that require secret keys, expensive quotas, or abuse protection must go through a trusted server boundary with validation, caching where allowed, and rate limiting.
- Supabase Edge Functions must pass the Deno-owned `npm run functions:verify` typecheck, lint, and tests. Keep them excluded from the Expo TypeScript and ESLint projects because those tools target the Node/React Native runtime rather than Deno.
- Paid external API boundaries must include durable hard caps before provider calls when provider-side quotas cannot be safely lowered.
- Google Maps keys are expected to be restricted to only the APIs and platforms currently used. Project address lookup uses server-side Places API (New), selected-address preview functions use server-side Maps Static API, the web projects map uses the Maps JavaScript API, Android project maps use Maps SDK for Android through `react-native-maps`, and iOS project maps use the native default Apple Maps provider unless a future custom native build intentionally enables Google Maps on iOS. If a future feature needs a different Google Maps API or SDK, remind the project owner to update Google Cloud key restrictions before rollout.
- Do not persistently cache third-party API content unless that provider's terms allow it; store only product data the user selected or created.
- Storage replacements must use immutable unique object paths and service-owned compensation: delete a newly uploaded object if its database reference cannot be committed, and delete the previous object only after the new reference succeeds. Avatar and project-cover reference changes must compare the expected previous reference to prevent concurrent replacements from overwriting each other.
- User avatars live in the private `user-avatars` bucket. Profile rows store stable avatar object paths (or external OAuth avatar URLs), UI hooks resolve short-lived signed URLs, authenticated users may read avatars without listing other users' objects, and only owners may upload or delete their avatar objects.
- Storage cleanup must go through the Supabase Storage API under the applicable DELETE policy. A failed cleanup after a successful database update must not roll back the valid new reference; report it to monitoring for reconciliation.

## Web / Hosting Notes

- Vercel is the current web hosting target
- Static web export is the current build path
- `vercel.json` uses:
  - `buildCommand: npm run build`
  - `outputDirectory: dist`
  - `cleanUrls: true`

## Mobile / Native Notes

- EAS is configured
- Android and iOS projects use Expo Continuous Native Generation: `android/` and `ios/` are generated from Expo app config and must remain ignored by Git.
- Native configuration changes must be represented in `app.json`, `app.config.js`, or an Expo config plugin so EAS Build can reproduce them.
- GitGuardian secret scanning runs as a local pre-commit hook; contributors must authenticate `ggshield` before committing.
- Bundle/package identifiers:
  - iOS: `com.florenciasoldavini.onzait`
  - Android: `com.florenciasoldavini.onzait`
- Face ID / Touch ID is intentionally not implemented yet

## Naming / Brand Decisions

- Current product/app name: `onzait`
- Older `on-site` naming is legacy and should not be reintroduced unless intentionally migrating something old

## Practical Next Steps

- Promote the first real user to `admin` manually via SQL
- Add future tables through feature-specific Supabase migrations
- Add project-level RLS only when those tables are actually introduced
- If auth changes again, preserve the rule that role assignment must stay server/database controlled
