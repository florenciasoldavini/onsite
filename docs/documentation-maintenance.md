# Documentation Maintenance

Purpose: lightweight rules for keeping project documentation current
Source of truth for: documentation ownership, update triggers, and doc review workflow
Update when: doc ownership changes, PR process changes, or new documentation categories are introduced
Last reviewed: 2026-07-31

## Core rule

Documentation should be updated in the same change where behavior, setup, or architecture changes.

When a new project rule is added, scan existing code, docs, env config, and tests for places where the rule already applies. Either update those surfaces in the same change or record a clear follow-up gap.

## Source of truth map

- `README.md`
  - Project setup
  - Daily development commands
  - Verification steps
  - Deployment basics
- `AGENTS.md`
  - Current architecture snapshot
  - Auth decisions
  - Product and platform guardrails
- `docs/CONTRIBUTING.md`
  - Contribution scope
  - Branch, verification, and pull request workflow
  - Contributor ownership expectations
- `.github/SECURITY.md`
  - Private vulnerability reporting process
  - Supported release policy and disclosure expectations
- `docs/security-baseline.md`
  - Internal implementation and release security rules
- `supabase/README.md`
  - Supabase bootstrap scope
  - Migrations
  - RLS decisions
  - Auth redirect configuration
- `docs/`
  - Longer-lived design and reference material
- `docs/onzait-design-system.md`
  - Active design-system rules
  - Token and primitive source map
  - Reusable interaction-state decisions
- `docs/testing-strategy.md`
  - Automated test layers and ownership
  - Test-file naming and design rules
  - Change-based coverage expectations and testing gaps
- `docs/internationalization.md`
  - Supported app and transactional-email languages and locale-selection policy
  - i18next architecture, translation ownership, authoring, and verification rules
  - Active versus deferred localization scope
- `docs/notifications.md`
  - Approved notification events, recipients, categories, and destinations
  - Inbox, push, content-safety, preference, localization, and retention rules
  - Active versus planned notification behavior

## Update triggers

Update `README.md` when:

- package scripts change
- local setup changes
- verification commands change
- deploy flow changes
- required env vars change
- public roadmap, contribution, security, or licensing links change

Update `AGENTS.md` when:

- auth architecture changes
- route guarding changes
- platform ownership changes
- naming or product constraints change
- project-level implementation rules change
- supported platform expectations change for web, iOS, or Android

Update env documentation when:

- a feature introduces a new key or env var
- `env-sync.config.json` changes
- `.env.example` needs regeneration
- `.env.local` needs a local placeholder for a newly required value

Update `docs/email-flow.md` when:

- a transactional email type, supported email language, provider, or builder changes
- Send Email Hook signing, idempotency, timeout, or activation requirements change
- email deployment order or required server secrets change

Update `supabase/README.md` when:

- a new migration is added
- RLS changes
- client data-access scope changes
- auth redirect configuration changes
- Edge Function runtime, verification, or trusted-boundary behavior changes

Update `docs/onzait-design-system.md` when:

- a reusable visual rule is decided
- a design-system primitive changes
- a component state pattern changes
- a screen-level design decision should become reusable

Update `docs/testing-strategy.md` when:

- a test runner or test harness changes
- test-file location or naming conventions change
- a test layer is introduced, removed, or materially redefined
- CI test enforcement or coverage thresholds change
- automated or manual platform-verification expectations change

Update `docs/internationalization.md` when:

- supported languages or fallback behavior changes
- locale detection or preference persistence changes
- resource loading, namespace ownership, or translation tooling changes
- formatting, authoring, security, or localization verification rules change
- a planned localization capability becomes active or its deferred scope changes

Update `docs/notifications.md` when:

- a notification producer, event, category, recipient rule, or destination changes
- inbox or delivery-channel behavior changes
- notification preferences, localization, content-safety, or retention rules change
- planned notification capabilities become implemented or deferred scope changes

Update `docs/CONTRIBUTING.md` when:

- accepted contribution types change
- branch or pull request workflow changes
- required CI checks change
- contributor ownership or licensing rules change

Update `.github/SECURITY.md` when:

- the private reporting channel changes
- supported release policy changes
- response or disclosure expectations change
- a bug bounty or formal security program is introduced

## PR workflow

- Every PR should either update affected docs or explicitly state that no doc update was needed.
- Use `.github/pull_request_template.md` to review doc impact before merging.

## CI workflow

- `.env.example` is generated from `env-sync.config.json`.
- CI enforces that generated env documentation is up to date through `npm run env:check`.

## Writing rules

- Keep operational docs short and specific.
- Prefer one source of truth per topic.
- Mark non-authoritative docs clearly as `Deprecated`, `Historical`, or `Draft`.
- Do not document planned architecture as if it already exists.
