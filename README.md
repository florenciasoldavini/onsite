# Onzait

[![CI Checks](https://github.com/florenciasoldavini/onzait/actions/workflows/env-check.yml/badge.svg)](https://github.com/florenciasoldavini/onzait/actions/workflows/env-check.yml)

**A mobile-first workspace for organizing construction projects across the job site and the office.**

Onzait is a personal product I am designing and developing to make construction project information easier to capture, find, and act on. The product is aimed at the people coordinating day-to-day work—project leads, site managers, contractors, and small construction teams—who need the same project context on a phone in the field and on a larger screen for planning or client feedback.

The current MVP foundation focuses on secure account access and project management: teams can create structured project records, select reliable site addresses, review projects as a list or map, and keep project access owner-scoped. The app is built with Expo and React Native so shared product logic can serve web, iOS, and Android while each platform still gets the appropriate map, authentication, and interaction behavior.

> **Current status:** active MVP development. Projects V1 and the auth/profile foundation are implemented; task management and the project workspace modules shown as quick actions are not yet complete.

[Hosted web build](https://onzait.vercel.app) · [Product roadmap](https://github.com/users/florenciasoldavini/projects/1) · Account creation or sign-in is required. This is the current deployed app, not a seeded or anonymous portfolio demo.

> **Source license:** The source code is publicly viewable for portfolio evaluation only. No permission is granted for commercial use, copying, modification, or redistribution. See the [proprietary license](LICENSE).

## Product capabilities

### Implemented on this branch

- **Cross-platform authentication:** email/password, Google OAuth, Apple OAuth, email verification and resend, password reset, and session-driven protected routing.
- **Account management:** profile details, avatar upload, password updates, and Google/Apple identity linking from the profile screen.
- **Projects V1:** create, view, edit, search, filter, sort, and soft-delete projects with explicit delete confirmation.
- **Project context:** status, phase, dates, building/project type, progress, description, cover image, and a Google-selected address with stored coordinates.
- **List and map discovery:** responsive project cards plus web/native map implementations, project markers, previews, and optional live user location.
- **Project photos:** private project galleries, camera/library batch review, automatic HEIC conversion, operational categories, independent marketing classification, EXIF capture context, metadata editing, and confirmed soft deletion.
- **Secure data access:** owner-scoped project access for normal users, admin-wide access through database policies, private project-cover storage, and repository-level filtering of soft-deleted records.
- **Trusted Maps workflows:** address autocomplete, place resolution, and static previews run through Supabase Edge Functions with authentication, validation, rate limiting, and durable monthly usage caps before provider calls.
- **Reusable UI foundation:** shared design tokens and primitives for typography, fields, buttons, cards, navigation, skeletons, empty states, toasts, and responsive layouts.
- **Operational foundations:** generated environment documentation, Sentry integration, Vercel static web delivery, and EAS configuration for native builds.

### In progress or intentionally deferred

- **Tasks:** the Tasks tab is a styled placeholder on this branch; task persistence and CRUD are not presented here as complete.
- **Project workspace modules:** Photos is implemented separately from Documentation. Documentation, Incident Log, To-do List, and Daily Report remain future affordances.
- **Multi-user collaboration:** project participation, invitations, and participant-based access are deferred; Projects V1 currently uses owner/admin access.
- **Portfolio media:** no product screenshots or walkthrough video are committed yet. The capture plan is documented below.
- **Launch polish:** custom domain, branded auth/email configuration, and related launch setup remain tracked in `docs/pending-launch-setup.md`.

## My contribution

Onzait is a personal product that I am shaping from product definition through implementation. My work includes:

- translating construction and job-site coordination needs into a staged MVP rather than front-loading a speculative schema;
- designing the mobile-first information hierarchy and a reusable, token-based interface system for field and desktop contexts;
- building the Expo Router and React Native application across responsive web, iOS, and Android targets;
- owning the current full-stack path through Supabase Auth, Postgres migrations, RLS policies, Storage, and Edge Functions;
- defining feature boundaries that separate UI, cache state, workflows, persistence, and third-party transport;
- treating security, loading/error feedback, destructive-action confirmation, validation, environment drift, and API cost controls as product requirements;
- making platform-specific decisions where a shared implementation would be a worse fit, including web, Android, and iOS map delivery.

The project is also an exercise in product judgment: the tracked database started with identity and added Projects only when that feature was built, while unimplemented workspace areas stay visibly marked as future work.

## Technical architecture

```text
screens / components
        ↓
      hooks          React Query state and cache behavior
        ↓
     services        product workflows and orchestration
        ↓
   repositories      persistence and external transport
        ↓
Supabase / Storage / Edge Functions
```

- **Primary application path:** the Expo client talks directly to Supabase Auth and RLS-protected product tables through feature repositories. Supabase is the source of truth for identity, and `public.users.id` matches `auth.users.id`.
- **Authorization:** Postgres RLS enforces owner/admin rules independently of client UI. The client cannot choose its role or assign privileged ownership values.
- **Server boundaries:** secret or paid Google Maps web-service calls go through Supabase Edge Functions. The client stores only selected project data such as address, place ID, latitude, and longitude.
- **Client data state:** TanStack React Query owns project queries, mutations, caching, and invalidation. Hooks call services rather than raw Supabase or Google APIs.
- **Validation:** production forms use React Hook Form with Zod resolvers; Edge Functions and database constraints provide additional validation at trusted boundaries.
- **Maps:** web renders with the Maps JavaScript API, Android uses `react-native-maps` with Maps SDK for Android, and iOS uses the native Apple Maps provider. Address lookup and static previews remain server-side.
- **Delivery:** Expo Router and React Native provide shared product code. Web is exported statically to `dist` for Vercel; native configuration is reproducible through Expo app config and EAS.
- **Monitoring:** Sentry is initialized for runtime error reporting when its public DSN is configured.

There is intentionally no separate application server today. A dedicated API or worker should be introduced only when a concrete feature needs capabilities that the current Supabase architecture cannot safely provide, such as durable background jobs, complex multi-system orchestration, or a provider integration that does not fit an Edge Function.

## Engineering decisions and tradeoffs

| Decision | Why it fits now | Tradeoff |
| --- | --- | --- |
| Expo Router + React Native | One product model and navigation system can target web, iOS, and Android while allowing platform files where needed. | Platform behavior still needs explicit testing; maps and OAuth cannot be treated as identical everywhere. |
| Supabase as the active backend | Auth, Postgres, RLS, Storage, and Edge Functions support a small full-stack MVP without a separate always-on API. | Good policy design and database tests are essential because the client can access product tables directly. |
| Feature-specific migrations | Schema is introduced with working product slices instead of an unused all-domain model. | Future collaboration and task models require deliberate migrations rather than being available in advance. |
| Server-side Google Maps web services | Secret keys, validation, abuse controls, and hard spending caps stay behind a trusted boundary. | Map rendering still needs restricted platform keys, and each new Maps API requires a key-restriction review. |
| Shared design-system primitives | Tokens and reusable controls keep dense operational screens consistent and make cross-platform refinement faster. | The system must stay grounded in real product screens rather than becoming a separate component exercise. |
| Generated environment contract | `env-sync.config.json` drives `.env.example` and deployment sync targets, reducing documentation drift. | Contributors must update metadata and regenerate examples whenever the contract changes. |

## Quality and verification

The repository currently configures:

- strict TypeScript checking and Expo ESLint for the app, plus native Deno typecheck and lint for Edge Functions;
- Vitest unit tests for project validation/query planning, Maps response and error handling, rate limiting, and profile avatar paths;
- pgTAP tests for Projects RLS/storage policies and Google Maps usage caps;
- GitHub Actions checks for environment-documentation drift, app TypeScript/lint, Edge Function typecheck/lint/tests, unit tests, frontend production export, and high/critical dependency vulnerabilities introduced by pull requests;
- monthly grouped Dependabot version updates for the app, with routine update PRs targeting `development`;
- accessibility-aware shared primitives and screen controls, including labels for icon actions, loading announcements, readable status text, and keyboard/tap-target guidance;
- responsive layouts and platform-specific map components for phone, tablet, desktop web, iOS, and Android;
- explicit skeleton, spinner, disabled, empty, error, toast, and confirmation states across implemented async and destructive flows.

This is an engineering baseline, not a claim of formal accessibility certification or exhaustive device coverage. The current accessibility and performance expectations are documented in `docs/seo-accessibility-baseline.md` and `docs/performance-baseline.md`.

### CI commands

```bash
npm run env:check
npx tsc --noEmit
npm run lint
npm test
npm run test:coverage
npm run build
npm run functions:verify
```

`npm run test:coverage` is diagnostic and does not currently enforce a CI threshold. Test layers, naming, ownership, and change-based expectations are defined in [`docs/testing-strategy.md`](docs/testing-strategy.md).

`npm test` runs the Vitest unit/workflow suite followed by the Jest/Expo rendered UI suite. Use `npm run test:unit` or `npm run test:ui` for a focused local pass.

### Database and local security checks

GitGuardian remains local/manual:

```bash
ggshield secret scan pre-commit
```

`npx supabase test db` requires a running local Supabase stack for local development. CI starts a clean local Postgres instance and runs the pgTAP suite on pull requests and pushes to `development` or `main`.

GitGuardian is configured as a local pre-commit hook. Automated GitGuardian scanning would require adding a `GITGUARDIAN_API_KEY` repository secret, so CI does not currently include a step that would fail without that credential.

## Screenshots and demo

No hiring-portfolio screenshots or demo video are tracked in this repository yet. Do not replace the items below with mock data presented as real product usage.

Capture TODO:

1. `projects-list-desktop.png` — responsive desktop list with search/filter controls and representative non-sensitive projects.
2. `projects-map-desktop.png` — web map view with safe demo locations and project preview.
3. `project-form-mobile.png` — native-width create/edit form showing address selection and validation.
4. `project-detail-mobile.png` — project progress, metadata, and action affordances, with future actions clearly identified.
5. `auth-profile-cross-platform.png` — sign-in and profile/account-management states without personal data.
6. `onzait-product-walkthrough.mp4` — short flow from sign-in to project creation, map discovery, edit, and confirmed deletion.

The [hosted web build](https://onzait.vercel.app) was reachable when this README was updated, but it requires authentication and does not provide a seeded demo account. Reviewers should treat it as a web preview rather than a frictionless public demo until a safe demo path is added.

## Developer setup

### Prerequisites

- Node.js 22 or newer
- npm 10 (the repository package manager declared in `package.json`)
- Deno 2.1 for local Edge Function verification
- an Expo-compatible iOS Simulator or Android Emulator for native local development
- a configured Supabase project for authenticated/product flows
- Docker and the Supabase CLI only when running the local database test stack

### Install and run

The repository uses npm. Use `npm ci` for a deterministic install:

```bash
npm ci
```

Create `.env.local` from the generated contract in `.env.example`, replace the placeholders needed for your target, and verify that the documentation is in sync:

```bash
npm run env:check
```

Start Expo:

```bash
npm run start
```

Platform shortcuts:

```bash
npm run web
npm run ios
npm run android
```

### Environment workflow

`.env.local` is the local source of truth for real values. `.env.example` is generated from `env-sync.config.json` and should not be hand-edited.

```bash
npm run env:example
npm run env:check
npm run sync:env -- --dry-run
npm run sync:env
```

The environment contract covers:

- public Expo/Supabase, Sentry, site URL, and restricted browser Maps configuration;
- Android Maps SDK build configuration (iOS uses Apple Maps by default);
- server-side Google Maps keys and hard-cap settings for Supabase Edge Functions;
- Resend/product-email settings;
- optional Sentry source-map settings;

See `.env.example` and `env-sync.config.json` for the full current list and deployment targets.

## Deployment

### Web

- Host: Vercel
- URL: `https://onzait.vercel.app`
- Build command: `npm run build`
- Output directory: `dist`
- Routing: clean URLs through `vercel.json`

### iOS and Android

- Expo project: `@florenciasoldavini/onzait`
- iOS bundle identifier: `com.florenciasoldavini.onzait`
- Android package: `com.florenciasoldavini.onzait`
- Build profiles: development, preview, and production in `eas.json`
- Native projects use Expo Continuous Native Generation; reproducible native settings belong in Expo app config or config plugins.

## Further documentation

- `AGENTS.md` — architecture decisions and implementation guardrails
- `docs/CONTRIBUTING.md` — reporting and invited-contribution workflow
- `docs/documentation-maintenance.md` — documentation ownership and update triggers
- `.github/SECURITY.md` — private vulnerability reporting policy
- `docs/onzait-design-system.md` — tokens, primitives, and form conventions
- `docs/security-baseline.md` — MVP security model and review checklist
- `docs/performance-baseline.md` — runtime and data-loading expectations
- `docs/seo-accessibility-baseline.md` — web SEO and cross-platform accessibility baseline
- `docs/pending-launch-setup.md` — custom domain, auth branding, DNS, and branded-email follow-up
- `docs/email-flow.md` — welcome email flow and deployment
- `supabase/README.md` — migrations, RLS, Storage, Edge Functions, and auth URLs
