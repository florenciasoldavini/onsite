# Testing Strategy

Purpose: define the test layers, naming conventions, ownership rules, and verification expectations used across Onzait
Source of truth for: automated test structure, test-file naming, change-based coverage expectations, and known testing gaps
Update when: a test runner, test layer, naming rule, CI test job, coverage policy, or supported platform verification approach changes
Last reviewed: 2026-07-28

## Goals

Onzait tests should give fast, trustworthy feedback at the boundary where a defect can be detected most clearly. The suite should:

- protect product rules and user-critical workflows;
- verify authorization and data invariants independently from client code;
- cover web, iOS, and Android differences where behavior can diverge;
- make failures identify one responsibility instead of one broad feature;
- avoid duplicating the same assertion at every layer;
- keep external providers, clocks, randomness, and network access deterministic.

The goal is risk-based confidence, not a large test count or a universal line-coverage target.

## Current Baseline and Gaps

The repository audit on 2026-07-28 found:

- 50 responsibility-focused Jest unit, hook, and workflow files containing 199 test cases;
- 30 rendered Jest files containing 75 React Native behavior tests;
- 2 Deno test files containing 11 Edge Function test cases;
- 8 pgTAP files planning 153 database assertions;
- 3 Playwright web smoke journeys running in desktop and mobile Chromium;
- 1 Maestro native smoke flow for installed iOS and Android development builds;
- strong coverage of schemas, pure utilities, service compensation workflows, query planning, Edge Function helpers, and RLS;
- all application test files located under their feature, shared, infrastructure, or root harness `tests/` owner;
- production-subject or cohesive-workflow filenames across the migrated Jest suite;
- an Expo/Jest React Native Testing Library harness with shared auth, React Query, navigation, theme, and safe-area providers;
- rendered coverage for shared states; every public auth screen; client, contractor, worker, and supplier catalogs/forms; project list/form/detail behavior; project-photo list/upload/detail behavior; profile information/security/identity interactions; confirmed deletion; and compact/expanded directory behavior;
- React Query hook coverage for client, contractor, worker, supplier, trade-category, location, project, project-map, live-location, project-photo, and profile authentication boundaries, bounded loading, cache priming, and invalidation;
- automated public-auth and route-protection browser smoke coverage at desktop and phone viewports;
- a native Maestro smoke flow that requires an installed development build and remains outside CI;
- no seeded authenticated end-to-end project create/edit/delete journey yet;
- no enforced code-coverage threshold.

The existing suite was migrated to these location and naming rules on 2026-07-28. This strategy applies immediately to every new or changed test.

## Test Layers

### 1. Static verification

TypeScript, ESLint, Expo Doctor, environment drift checks, and production builds catch integration defects that runtime unit tests do not.

Static checks are required verification, but they are not substitutes for behavior tests.

### 2. Unit and contract tests

Runner: Jest with the `jest-expo` preset.

Use these for:

- Zod schemas, normalization, formatting, and pure utilities;
- reducers and state machines without rendering UI;
- query-plan construction and transport mapping;
- stable error-code mapping;
- platform-independent business rules.

Keep these tests deterministic and free of real network, filesystem, database, or provider calls.

### 3. Service workflow tests

Runner: Jest with the `jest-expo` preset.

Use these for workflows spanning multiple repository operations, including:

- upload, commit, and compensation behavior;
- auth callback and session outcomes;
- pagination metadata and signed-URL resolution;
- error translation and monitoring behavior;
- ordering requirements across persistence operations.

Mock repositories and technical adapters at the subject's immediate boundary. Assert public outcomes and essential collaboration, not private implementation steps.

### 4. Component and screen behavior tests

Runner: Jest with the `jest-expo` preset and React Native Testing Library.

Jest owns both `.test.ts` logic/workflow tests and `.test.tsx` rendered tests. The shared `jest-expo` preset supplies consistent TypeScript, Expo, and React Native transforms and mocks across the application suite.

Use rendered tests for behavior that cannot be proven through extracted pure state alone:

- loading, empty, error, success, and retry states;
- required-field validation and disabled submit behavior;
- destructive confirmation and pending-state protection;
- user interaction, focus, accessibility labels, and navigation intent;
- compact, medium, and expanded conditional rendering;
- platform-specific branches that affect product behavior.

Use `renderWithAppProviders` from `tests/support/render.tsx` for product components that need the standard auth, React Query, navigation, Gluestack theme, or safe-area contexts. Tests may opt out of navigation or override auth, query-client, and safe-area values when the behavior requires it.

The harness does not emulate a browser, physical device, native permissions, or provider consoles. Every affected UI flow still requires the applicable manual web and native verification, and pure helper tests do not count as screen coverage.

Snapshot tests must not be the primary proof of behavior. Prefer queries and assertions that describe what a user can perceive or do.

### 5. Database and RLS tests

Runner: pgTAP through the Supabase CLI.

Every migration that changes tables, grants, RLS, triggers, database functions, or Storage policies must add or update tests under `supabase/tests/`.

Cover, where applicable:

- owner access;
- admin access;
- unauthenticated and cross-user denial;
- insert and update invariants;
- soft deletion and archived-row behavior;
- deterministic pagination/order support;
- same-owner relationship constraints;
- Storage read, insert, update, and delete policy behavior;
- atomic database-function success and rollback behavior.

Client repository tests may verify query construction, but only pgTAP tests prove database authorization.

### 6. Edge Function tests

Runner: Deno, owned by `supabase/functions/deno.json`.

Test request validation, authentication boundaries, stable error responses, rate limits, hard caps, cache behavior, provider response mapping, and failure redaction. Provider HTTP calls must be replaced with deterministic fakes.

Expo TypeScript, ESLint, and Jest must not absorb the Deno test surface.

### 7. End-to-end and manual platform verification

Web runner: Playwright against a production Expo static export served locally.

Native runner: Maestro against an installed iOS or Android development build.

The Playwright smoke suite runs in CI with desktop and mobile Chromium. Keep it small and limited to stable cross-screen behavior. It currently proves public sign-in validation, public account-entry navigation, and unauthenticated route protection. It does not use production credentials or data.

The Maestro flow verifies the equivalent unauthenticated entry behavior on an installed native build. It is not a required CI job because CI does not currently produce and boot native development builds.

Authenticated project creation, editing, and confirmed deletion require an isolated seeded Supabase test-data strategy before they can become reliable end-to-end tests. Until those journeys and device/provider automation exist, user-critical changes still require recorded manual verification on every affected runtime:

- web at representative phone and desktop widths;
- iOS for native or platform-sensitive behavior;
- Android for native or platform-sensitive behavior;
- portrait, landscape, tablet, or multitasking layouts when the change can affect them;
- keyboard interaction, permission denial, OAuth, maps, image selection, and other device/provider paths when relevant.

Do not point automated tests at production accounts or data. Add authenticated browser journeys only with isolated local users, deterministic cleanup, and no provider-console dependency.

## File Location and Naming

### Jest application tests

Feature tests live in:

```text
features/<feature>/tests/
```

Shared and infrastructure tests live in:

```text
shared/tests/
infrastructure/tests/
```

Cross-cutting app test configuration and provider helpers live in:

```text
tests/support/
```

Root `tests/` support may compose public feature providers for the app harness. Production code and `shared/` must not import from root test support, and root support must not own feature behavior tests.

Use:

```text
<production-subject>.test.ts
<component-or-screen>.test.tsx
<workflow-name>.test.ts
```

Examples:

```text
client.schema.test.ts
client-list-query.test.ts
clients.service.test.ts
project-form-screen.test.tsx
project-cover-workflow.test.ts
```

Rules:

- name the production responsibility, not only the feature;
- keep one primary production responsibility or cohesive workflow per file;
- match the production basename when one file is the clear subject;
- use `.test.tsx` only for tests that render JSX;
- do not use generic names such as `clients.test.ts` or `projects.test.ts` for new suites;
- do not encode `unit` in every filename; the subject and test layer should make the scope clear;
- use `integration` in a filename only when the test crosses real technical boundaries rather than mocked ones.

Use `describe("<subject or workflow>")` and behavior statements such as `it("rejects cross-owner relationships")`. Test names should describe the observable rule, not repeat a function name.

### Database

Use:

```text
supabase/tests/<capability>_rls.test.sql
supabase/tests/<capability>.test.sql
```

Keep one transaction and one explicit pgTAP plan per file. Assertion descriptions must identify the acting role, operation, and expected outcome when authorization is involved.

### Edge Functions

Use:

```text
supabase/functions/tests/<capability>.test.ts
```

Use `Deno.test` and behavior-focused names. A capability suite may cover shared helpers used by several thin function entrypoints when they share one trusted boundary.

## What Each Change Must Test

| Change type                                          | Minimum automated coverage                                                               | Additional verification                         |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Pure schema, utility, reducer, or mapper             | Jest unit tests for success, boundary, and failure cases                                 | TypeScript and lint                             |
| Repository query or transport mapping                | Jest contract tests for filters, ordering, pagination, and stable errors                 | pgTAP if database behavior also changes         |
| Multi-step service workflow                          | Jest service test for success plus important partial failures and compensation           | Monitoring/error-language review                |
| Hook, component, form, or screen                     | Rendered behavior test once the UI harness exists; otherwise document the automation gap | Manual checks on every affected platform/layout |
| Migration, grant, RLS, trigger, or database function | pgTAP owner/admin/denial/invariant tests                                                 | Run against a clean local Supabase stack        |
| Edge Function or shared function helper              | Deno tests for validation, auth, caps, mapping, and safe failures                        | `npm run functions:verify`                      |
| Platform-specific adapter or branch                  | A test for each materially different branch where automation supports it                 | Manual verification on each affected runtime    |
| User-critical cross-screen journey                   | Focused lower-layer tests; automated end-to-end smoke test once available                | Manual journey verification until then          |

Bug fixes must include a regression test at the lowest layer that reproduces the defect faithfully. Add a higher-layer test only when the bug depended on integration between responsibilities.

## Test Design Rules

- Use Arrange, Act, Assert structure without mandatory comments.
- Prefer factories/builders with safe defaults when test records become repetitive.
- Keep fixtures synthetic and free of credentials, personal data, or production identifiers.
- Control time, randomness, generated IDs, and provider responses.
- Reset mocks and mutable state between tests.
- Test stable codes and product outcomes instead of raw provider messages.
- Avoid testing library internals, framework behavior, or trivial passthroughs.
- Do not weaken production boundaries only to make code testable; inject or isolate the real boundary.
- Keep collection fixtures small while still proving pagination and ordering.
- A skipped test must link to a tracked reason or explain the temporary blocker; silent permanent skips are not acceptable.

## Coverage Policy

`npm run test:coverage` is a diagnostic tool. Coverage percentages do not replace risk analysis, and CI does not currently enforce a global threshold.

Before introducing thresholds:

1. configure meaningful inclusion and exclusion rules;
2. establish a clean baseline on Node 22;
3. exclude generated UI primitive code and other non-owned output;
4. set thresholds by owned responsibility or changed code rather than choosing an arbitrary repository-wide number;
5. add enforcement in the same change that documents the agreed baseline.

New or materially changed business logic should still be fully exercised across its meaningful branches even without a numeric gate.

## Commands

Run the smallest useful command while developing, then the full relevant suite before handoff:

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e:web
npm run test:e2e:native
npm run functions:test
npm run functions:verify
npm run i18n:check
npx supabase test db
```

Localization changes must cover resource parity, interpolation and plural
variants, startup detection and persistence, representative Spanish and English
rendering, accessibility names, locale formatting, and both selector
locations. Transactional-email changes additionally cover subjects, HTML
language, safe interpolation, UTC date formatting, signed Auth hook payloads,
token-link construction, idempotency, timeouts, and provider failure paths.

The root package requires Node 22 or newer. Install Playwright Chromium with `npx playwright install chromium` before the first local web smoke run. Native smoke runs require Maestro plus an installed Onzait development build. A failure caused by missing required tooling is an environment failure, not evidence that the product behavior passed or failed.

## Suite Migration Status

The 2026-07-28 migration:

- split the broad client, contractor, worker, supplier, project, photo, and shared-contact suites by production responsibility;
- moved Maps payload and error coverage to `features/locations/tests/`;
- moved the shared rate-limit coverage to `shared/tests/`;
- moved colocated layout and splash tests into `shared/tests/`;
- renamed repository, service, schema, utility, and workflow suites around their actual subjects;
- preserved all 163 application cases while increasing the suite from 28 mixed files to 40 focused files;
- consolidated the application suite on Jest after adding the Expo rendered-test harness.

Future test-organization changes should preserve the same behavior-first rule: do not mix structural renames with unrelated product behavior when doing so would obscure review.

## Adoption Priorities

1. Add isolated Supabase test users and cleanup so Playwright can cover authenticated project creation, editing, confirmed deletion, and photo upload.
2. Add a reproducible native development-build job before making the Maestro flow a required CI check.
3. Add controlled automation for OAuth, maps, image-picker, permission, keyboard, and tablet-landscape behavior where the provider or device boundary permits it.
4. Establish a meaningful coverage baseline before adding numeric CI gates.
