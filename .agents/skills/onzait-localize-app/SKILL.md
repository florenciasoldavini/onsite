---
name: onzait-localize-app
description: Implement or audit internationalization and localization in the Onzait Expo application. Use when adding or changing i18next setup, language detection or persistence, Spanish or English resources, translation keys, namespaces, selectors, plurals, localized formatting, language selectors, user-facing copy, accessibility text, localization tests, or when reviewing Onzait changes for untranslated, unsafe, or cross-platform-inconsistent behavior.
---

# Localize the Onzait application

Apply Onzait's approved internationalization contract without confusing planned behavior with the current repository state. Keep detailed policy in the canonical project document rather than duplicating it here.

## 1. Ground in current state

Before planning, editing, or auditing:

1. Read the nearest `AGENTS.md` completely.
2. Read `docs/internationalization.md` completely.
3. Read the relevant architecture, testing, error-handling, accessibility, and feature documentation for the affected surfaces.
4. Inspect the package manifest, app initialization, storage adapters, shared utilities, feature ownership, translation resources, tests, and working tree.
5. Confirm whether issue #58 remains planned, is partially implemented, or is active. Do not assume modules or commands described by the contract already exist.

Treat pre-existing changes as user-owned. Preserve repository dependency direction and keep route files limited to routing concerns.

## 2. Classify the request

- For implementation, identify every affected user surface, owning feature, namespace, platform, and test boundary before editing.
- For an audit or review, remain read-only unless the user explicitly asks for fixes. Report actionable findings with precise files and lines.
- For copy-only changes, still verify placeholder, plural, formatting, accessibility, and key parity contracts.
- For a new language, fallback policy, remote backend, TMS, locale routing, or synchronized preference, stop and surface the required product-contract update before implementing it.

## 3. Implement within ownership boundaries

Follow these rules:

- Initialize one i18next instance at the app boundary and wait for finite startup resolution.
- Keep locale detection and preference persistence behind a shared platform adapter. Do not call device-locale or storage APIs from product screens.
- Bundle resources and let features own their namespaces. Aggregate them at the initialization boundary without making `shared/` import from `features/`.
- Use TypeScript resources with literal inference and strict selector calls. Keep both languages structurally identical.
- Translate stable error codes and structured product outcomes, never raw provider or exception messages.
- Keep user-authored content and persisted language-neutral codes unchanged; translate their presentation.
- Use complete messages, JSON v4 plurals, and locale-aware formatting. Do not concatenate translated fragments.
- Load required Intl polyfills before native plural resolution.
- Keep untrusted values out of nesting-options JSON and unescaped translation output.
- Make language controls accessible, persistent, immediate, and usable in compact, tablet, and desktop layouts.
- Update the canonical document when a decision or active status changes.

Do not add a remote backend, chained cache, runtime missing-key writes, TMS, transactional-email localization, or synchronized profile preference unless the user explicitly expands scope and the contract is updated.

## 4. Audit the complete user surface

Inspect changed and adjacent surfaces for:

- route, navigation, heading, form, action, menu, placeholder, helper, and confirmation copy;
- validation, loading, empty, invalid-link, not-found, forbidden, error, retry, toast, and permission states;
- accessibility labels, hints, image descriptions, and selector state;
- dynamic counts, plurals, dates, times, numbers, currencies, and lists;
- untranslated source strings, raw keys, blank values, mismatched placeholders, and missing plural variants;
- direct infrastructure imports, duplicate locale state, unbounded initialization loading, and unsafe nesting;
- language behavior on web, iOS, Android, phone, tablet, landscape, and desktop;
- stale documentation that describes planned behavior as active or active behavior as deferred.

Searches and extraction tools are evidence aids. Inspect rendered behavior and resource meaning; a clean string scan does not prove translation completeness.

## 5. Verify proportionately

Run the checks required by `docs/internationalization.md`, `docs/testing-strategy.md`, and the changed scope. When available, include:

- official i18next CLI lint, locale synchronization, extraction, or type checks;
- focused tests for detection, fallback, persistence, selectors, plurals, formatting, and representative rendered copy;
- `npx tsc --noEmit`;
- `npm run lint`;
- focused Jest suites, then broader `npm test` when warranted;
- `npm run build` for web integration;
- applicable Playwright and manual web, iOS, and Android verification.

Use real Spanish and English resources for copy, fallback, accessibility, and formatting assertions. Use `cimode` only for stable automation where translated text is not the behavior under test.

Never claim a command or platform passed when it did not run. Explain unavailable checks and keep failures visible.

## 6. Hand off evidence

For implementation, report:

- languages and surfaces covered;
- resource and namespace ownership;
- selection, persistence, fallback, formatting, and plural behavior;
- automated and manual verification with results;
- remaining untranslated or deferred surfaces;
- documentation and dependency changes.

For an audit, lead with findings ordered by severity. Include exact evidence, affected platforms, user impact, and the smallest safe remediation. State explicitly when no actionable findings remain.
