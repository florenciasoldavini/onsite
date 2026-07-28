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

- 40 responsibility-focused Vitest files containing 163 test cases;
- 3 rendered Jest files containing 5 React Native behavior tests;
- 2 Deno test files containing 11 Edge Function test cases;
- 8 pgTAP files planning 153 database assertions;
- strong coverage of schemas, pure utilities, service compensation workflows, query planning, Edge Function helpers, and RLS;
- all Vitest files located under their feature, shared, or infrastructure `tests/` owner;
- production-subject or cohesive-workflow filenames across the migrated Vitest suite;
- an Expo/Jest React Native Testing Library harness with shared auth, React Query, navigation, theme, and safe-area providers;
- initial rendered coverage for the shared empty state, destructive confirmation dialog, and provider harness;
- no automated browser or native end-to-end suite;
- no enforced code-coverage threshold.

The existing suite was migrated to these location and naming rules on 2026-07-28. This strategy applies immediately to every new or changed test.

## Test Layers

### 1. Static verification

TypeScript, ESLint, Expo Doctor, environment drift checks, and production builds catch integration defects that runtime unit tests do not.

Static checks are required verification, but they are not substitutes for behavior tests.

### 2. Unit and contract tests

Runner: Vitest in the root Node environment.

Use these for:

- Zod schemas, normalization, formatting, and pure utilities;
- reducers and state machines without rendering UI;
- query-plan construction and transport mapping;
- stable error-code mapping;
- platform-independent business rules.

Keep these tests deterministic and free of real network, filesystem, database, or provider calls.

### 3. Service workflow tests

Runner: Vitest.

Use these for workflows spanning multiple repository operations, including:

- upload, commit, and compensation behavior;
- auth callback and session outcomes;
- pagination metadata and signed-URL resolution;
- error translation and monitoring behavior;
- ordering requirements across persistence operations.

Mock repositories and technical adapters at the subject's immediate boundary. Assert public outcomes and essential collaboration, not private implementation steps.

### 4. Component and screen behavior tests

Runner: Jest with the `jest-expo` preset and React Native Testing Library.

Vitest remains responsible for Node-based unit and service tests. Jest owns `.test.tsx` rendered tests because `jest-expo` supplies Expo and React Native module transforms and mocks that the Node-only Vitest configuration does not.

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

Expo TypeScript, ESLint, and Vitest must not absorb the Deno test surface.

### 7. End-to-end and manual platform verification

There is no automated end-to-end harness yet. Do not describe end-to-end coverage as implemented.

Until automation is introduced, user-critical UI changes require recorded manual verification on every affected runtime:

- web at representative phone and desktop widths;
- iOS for native or platform-sensitive behavior;
- Android for native or platform-sensitive behavior;
- portrait, landscape, tablet, or multitasking layouts when the change can affect them;
- keyboard interaction, permission denial, OAuth, maps, image selection, and other device/provider paths when relevant.

An end-to-end tool should be introduced only with a small, reliable smoke suite and documented ownership. The first automated journeys should be sign-in, project creation/editing, and confirmed deletion rather than broad low-value coverage.

## File Location and Naming

### Vitest

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
| Pure schema, utility, reducer, or mapper             | Vitest unit tests for success, boundary, and failure cases                               | TypeScript and lint                             |
| Repository query or transport mapping                | Vitest contract tests for filters, ordering, pagination, and stable errors               | pgTAP if database behavior also changes         |
| Multi-step service workflow                          | Vitest service test for success plus important partial failures and compensation         | Monitoring/error-language review                |
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
npm run test:watch
npm run test:ui:watch
npm test
npm run test:unit
npm run test:ui
npm run test:coverage
npm run functions:test
npm run functions:verify
npx supabase test db
```

The root package requires Node 22 or newer. A failure caused by running the suite on an unsupported Node version is an environment failure, not evidence that the test suite passed or failed.

## Suite Migration Status

The 2026-07-28 migration:

- split the broad client, contractor, worker, supplier, project, photo, and shared-contact suites by production responsibility;
- moved Maps payload and error coverage to `features/locations/tests/`;
- moved the shared rate-limit coverage to `shared/tests/`;
- moved colocated layout and splash tests into `shared/tests/`;
- renamed repository, service, schema, utility, and workflow suites around their actual subjects;
- preserved all 163 Vitest cases while increasing the suite from 28 mixed files to 40 focused files.

Future test-organization changes should preserve the same behavior-first rule: do not mix structural renames with unrelated product behavior when doing so would obscure review.

## Adoption Priorities

1. Cover representative form, async-state, retry, and destructive-confirmation behavior with the rendered harness.
2. Add rendered hook tests for React Query cache behavior and auth-provider session transitions.
3. Establish a meaningful coverage baseline before adding numeric CI gates.
4. Add a small automated end-to-end smoke suite after the critical flows and test data strategy are stable.
