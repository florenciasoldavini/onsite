# Contributing to Onzait

Purpose: explain how to report problems, propose product work, and prepare explicitly invited changes
Source of truth for: contribution scope, branch and pull request workflow, verification, and contributor ownership expectations
Update when: contribution policy, branch strategy, required checks, licensing, or review expectations change
Last reviewed: 2026-07-16

## Project status and contribution scope

Onzait is a proprietary personal product in active MVP development. Its source is publicly viewable for portfolio review and evaluation, but it is not an open-source project. The repository license does not grant permission to use, copy, modify, redistribute, or commercialize the source.

Product feedback and reproducible bug reports are welcome. Unsolicited code contributions are not currently accepted. Do not begin implementation or open a pull request unless the maintainer has explicitly invited the change.

Before any external code contribution can be merged, the contributor and maintainer must agree in writing on the ownership or licensing terms for that contribution. Opening a pull request by itself does not replace that agreement.

## Report a bug or propose work

- Search [existing issues](https://github.com/florenciasoldavini/onzait/issues) before creating a new one.
- Use the repository's structured bug or feature form through [New issue](https://github.com/florenciasoldavini/onzait/issues/new/choose).
- Describe the user or workflow problem before proposing an implementation.
- Include the affected platform: web, iOS, Android, or multiple platforms.
- Remove credentials, tokens, private project information, personal data, and sensitive logs.
- Review planned work on the public [Onzait Roadmap](https://github.com/users/florenciasoldavini/projects/1).

Security vulnerabilities must not be reported in a public issue. Follow the private process in [`.github/SECURITY.md`](../.github/SECURITY.md).

## Invited implementation workflow

When the maintainer explicitly invites a code change:

1. Confirm the issue, acceptance criteria, platform scope, and ownership terms before implementation.
2. Branch from the latest `development` branch.
3. Use a focused branch name such as `feature/...`, `fix/...`, `docs/...`, or `chore/...`.
4. Keep the change limited to one product or engineering outcome.
5. Use Conventional Commits with a clear imperative description.
6. Open the feature pull request against `development`, not `main`.
7. Complete every relevant section of `.github/pull_request_template.md`.
8. Keep the pull request in draft while required verification, documentation, migrations, provider setup, or visual evidence is incomplete.

`main` is the protected production branch. Changes reach it through the repository's release/integration workflow after they have been reviewed and verified in `development`.

## Local setup

Use the npm version and Node.js range declared in `package.json`.
Install Deno 2.1 when changing Supabase Edge Functions.

```bash
npm ci
npm run env:check
npm run start
```

Real values belong in `.env.local`. Never commit `.env.local`, credentials, service-role keys, database URLs, provider tokens, or production data. `.env.example` is generated from `env-sync.config.json` and must not be edited by hand.

## Architecture and product expectations

- Follow the dependency direction documented in `AGENTS.md`: screens/components -> hooks -> services -> repositories -> Supabase, Storage, or trusted server boundaries.
- Do not move secrets, privileged authorization, paid API calls, or abuse-sensitive operations into client code.
- Every product feature must account for web, iOS, and Android. Use platform-specific adapters or UI when shared behavior would be incorrect.
- Include explicit loading, empty, error, disabled, and destructive-action confirmation states where applicable.
- Production submit forms use React Hook Form with Zod validation.
- Add the unit, service-workflow, rendered UI, Edge Function, and database/RLS tests required by [`docs/testing-strategy.md`](testing-strategy.md). Record the required manual platform checks for behavior that the rendered harness cannot emulate.
- Do not present planned behavior as implemented in code, screenshots, documentation, or pull request descriptions.

## Verification

Run the checks relevant to the change:

```bash
npm run env:check
npx tsc --noEmit
npm run lint
npm test
npm run test:coverage
npm run test:e2e:web
npm run build
npm run functions:verify
```

`npm run test:coverage` is diagnostic and has no CI threshold yet; use it when changing non-trivial business logic or when assessing a testing gap.

Install Playwright Chromium once with `npx playwright install chromium` before running the web smoke suite. Native smoke automation requires Maestro and an installed Onzait development build, then runs with `npm run test:e2e:native`.

Also run:

- `npx supabase test db` when migrations, RLS, grants, triggers, functions, or database behavior change and the local Supabase environment is available.
- Manual web verification for web-facing behavior.
- Manual iOS and Android verification when native behavior changes.

GitHub Actions runs focused quality, Edge Function, unit-test, web-build, and Playwright web-smoke jobs. The final required aggregation check is `ci-checks`. Pull requests targeting `development` or `main` also run `dependency-review`, which fails when a dependency change introduces a high- or critical-severity vulnerability. Do not merge while a required check is failing, skipped unexpectedly, or still pending.

Existing lint warnings or unrelated failures must be reported honestly; they must not be hidden by disabling checks or using `--no-verify`.

## Documentation and visual evidence

- Update behavior, setup, architecture, environment, security, and design-system documentation in the same change that makes it stale.
- Follow `docs/documentation-maintenance.md` for source-of-truth ownership and update triggers.
- Use real screenshots or recordings for visual changes. Never fabricate product evidence or expose personal data, private projects, credentials, or production secrets.
- Include representative mobile and web evidence when layout or behavior differs.

## Pull request review

A pull request should be small enough to review as one coherent outcome and must state:

- the problem and solution;
- user and platform impact;
- important architecture or security decisions;
- verification that actually ran;
- migrations, environment changes, deployment steps, and provider-console requirements;
- known limitations and intentionally deferred work.

Review feedback should be resolved with focused follow-up commits. Do not force-push, rewrite published history, merge, or enable auto-merge without explicit maintainer direction.

## License and conduct

All repository content remains subject to the proprietary [`LICENSE`](../LICENSE). Third-party components retain their own license terms.

Be respectful, specific, and constructive. Do not submit harassment, discriminatory content, spam, deceptive evidence, secrets, personal data, or content you do not have the right to share.
