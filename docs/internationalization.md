# Internationalization

Purpose: define Onzait's approved product, architecture, authoring, security, and verification contract for localization
Source of truth for: supported app languages, locale selection, i18next integration, translation ownership, and localization quality
Update when: supported languages, locale persistence, translation loading, namespace ownership, formatting, localization tooling, or localized product surfaces change
Last reviewed: 2026-07-29
Status: approved implementation contract for GitHub issue #58; not yet implemented

## Current state

Onzait does not currently initialize i18next or ship localized application resources. The dependencies and runtime behavior in this document describe the approved target for issue #58, not existing behavior.

Until that implementation lands:

- do not describe the app as fully bilingual;
- inspect the repository before relying on any planned module, hook, test helper, or command;
- update this status in the same change that makes the contract active.

This contract covers user-facing application UI on web, iOS, and Android. Transactional email localization is deferred because those messages run through a separate trusted-server workflow.

## Product language policy

- Support Spanish and English in the first localization release.
- Treat Spanish as the launch language and English as the secondary portfolio language.
- Write Spanish copy in neutral Latin American Spanish. Use Argentine locale conventions where a date, time, number, or currency requires regional formatting.
- On first launch, map a supported Spanish device locale to Spanish and a supported English device locale to English.
- Map every other or unavailable device locale to Spanish.
- After the user explicitly chooses a language, persist that choice locally and give it precedence over later device-locale changes.
- Keep language preference device-local in this release. Do not add a database column, profile mutation, or cross-device synchronization.
- Make the selector available on public authentication surfaces and in Profile so signed-out and signed-in users can change language.
- Apply language changes without requiring an app restart.
- Use BCP 47 language tags at locale boundaries. Keep resource language codes stable and avoid introducing region-specific resource variants until their copy genuinely differs.

English is the missing-translation fallback. Unsupported device languages still start in Spanish; this is an application selection rule, separate from i18next's missing-key fallback chain.

## Approved architecture

### Runtime dependencies

The issue #58 implementation should introduce compatible current releases of:

- `i18next` 26.3 or later;
- `react-i18next`;
- `expo-localization`;
- `intl-pluralrules`, loaded before i18next initialization for React Native Hermes;
- the official `i18next-cli` as development tooling.

Reuse the existing `@react-native-async-storage/async-storage` dependency for native preference persistence. Use a platform adapter that provides equivalent persistent browser storage on web instead of importing native storage directly into product UI.

### Initialization and state

- Create one application i18next instance and initialize it once at the app boundary.
- Await initialization before rendering text that depends on translations. Do not allow a permanent loading state if preference storage or locale detection fails.
- Register `initReactI18next` and use `useTranslation` in React components.
- Keep locale detection and persistence behind a shared technical adapter. Product screens must not call device-locale or storage APIs directly.
- Resolve the startup language in this order:
  1. valid persisted user preference;
  2. supported device locale;
  3. Spanish.
- Recover from unreadable, invalid, or unavailable persisted state by applying device detection and then Spanish. Do not expose raw storage errors to users.
- Change language through `i18next.changeLanguage()` and persist the explicit choice only after a supported language is selected.
- Use `resolvedLanguage` for selector state and web language metadata when it represents the loaded resource language. Keep any distinct formatting locale explicit rather than deriving it from an unvalidated string.
- Set `supportedLngs` and reject arbitrary language values at the preference boundary.
- Keep production `debug`, `saveMissing`, and `updateMissing` disabled.

### Resources and ownership

- Bundle Spanish and English resources with the Expo application. Do not require a network request to render translations.
- Store resources as TypeScript objects with `as const` so keys and interpolation values can be inferred.
- Organize namespaces by feature, with a small shared namespace for truly product-agnostic copy such as common actions and reusable feedback.
- Let each feature own its translations alongside its other presentation concerns. Aggregate feature resources only at the shared application initialization boundary.
- Keep Spanish and English key structures identical.
- Use stable semantic keys rather than full source sentences as keys.
- Enable the current selector API in strict mode. Translation calls must select typed paths and identify their namespace explicitly where required by the installed i18next version.
- Use `ResourceNamespaceMap` or the compatible current module-augmentation mechanism so feature packages can contribute namespace typing without one monolithic type declaration.
- Do not move domain error mapping, business rules, or persistence logic into resource files.

Large resources may be split further only when bundle size, ownership, or editing complexity gives a concrete reason. Remote or lazy loading is not part of this release.

## Translation authoring rules

### Complete messages

- Translate complete messages rather than concatenating fragments.
- Use interpolation only for values known at runtime, such as names, counts, dates, or user-provided values.
- Prefer separate complete variants when a translated noun, article, gender, status, or payment method changes the grammar of the sentence.
- Keep interpolation placeholder names and value types identical across languages.
- Never use raw provider, database, HTTP, SDK, or exception messages as translated user copy. Map stable error codes or structured outcomes to translation keys and preserve technical causes only for trusted diagnostics.

### Plurals and context

- Use the i18next JSON v4 plural suffixes such as `_one`, `_other`, and `_zero` where the product needs a dedicated zero message.
- Always supply `count` when requesting a pluralized key.
- Use locale-aware cardinal or ordinal rules rather than `count === 1` logic in components.
- Use context variants only when the product has the relevant trusted context. Do not infer gender or other personal attributes merely to select grammar.
- Do not add the interval-plural postprocessor unless a real range-based message requires it.

`Intl.PluralRules` is mandatory in current i18next. React Native Hermes does not provide it, so the polyfill must load on native platforms before plural resolution is used.

### Formatting

- Use i18next's current Intl-backed formatter or a small shared wrapper around it for dates, times, relative times, lists, numbers, percentages, and currencies.
- Keep raw domain values separate from their localized presentation.
- Pass explicit locale and time-zone intent where product meaning depends on them.
- Do not restore the removed legacy `interpolation.format` callback. Register a named formatter through the current formatter service if built-in formatting cannot express a requirement.
- Test regional formatting independently from translated wording.

### Interpolation and nesting security

React escapes rendered text, so a React integration may configure `escapeValue: false`. That does not make arbitrary translation constructs safe.

- Keep `skipOnVariables: true`.
- Do not place user-controlled interpolation inside a nesting-options JSON block such as `$t(key, { "value": "{{input}}" })`.
- Do not use unescaped interpolation, raw HTML translation output, or translation-controlled navigation targets with untrusted values.
- Prefer calling translations separately in application code over passing dynamic options through a nested translation string.
- Do not change interpolation or nesting delimiters without documenting and testing the reason.

## User-facing coverage

Issue #58 is complete only when current user-facing application copy is accounted for in both languages, including:

- route and screen titles;
- navigation labels;
- buttons, links, menus, tabs, placeholders, helper text, and form labels;
- schema and form validation;
- loading, empty, invalid-link, not-found, forbidden, error, retry, and destructive-confirmation states;
- toasts, alerts, permission explanations, and mutation outcomes;
- accessibility labels, hints, roles with textual names, and image descriptions;
- dynamically formatted dates, times, numbers, currencies, counts, and list summaries;
- feature catalog display labels whose persisted values are language-neutral codes.

Do not translate product data entered by users, proper names, stable database codes, route paths, telemetry event names, log messages, or provider identifiers. Translate the presentation mapped from stable codes.

## Platform behavior

- Web, iOS, and Android must expose the same supported language choices and fallback behavior.
- Language selection must work in phone, tablet, landscape, multitasking, and desktop layouts without making primary actions unreachable.
- The selector must remain keyboard and screen-reader operable and expose its current selection accessibly.
- On web, update the document language metadata to the resolved UI language after initialization and language changes.
- Do not encode locale in routes for this release; static Expo web paths remain language-neutral.
- Native configuration must remain reproducible through Expo configuration. Do not edit generated `ios/` or `android/` projects.
- Translation loading must not depend on connectivity.

## Verification contract

### Static and resource checks

- Run the official `i18next-cli` lint and locale synchronization checks using committed configuration.
- Fail verification when locale key structures, plural variants, or interpolation placeholders diverge.
- Type-check selector calls and inferred interpolation parameters.
- Search changed product surfaces for newly introduced hard-coded user-facing strings. Treat automated extraction or linting as assistance, not proof of complete coverage.
- Keep deterministic resource ordering and avoid generated churn.

### Automated behavior

Add focused tests for:

- startup resolution precedence and unsupported-locale mapping;
- invalid or failed preference reads;
- preference writes and immediate language changes;
- missing Spanish keys falling back to English;
- representative English and Spanish rendering;
- plurals and locale-sensitive formatting;
- language selector accessibility and behavior in signed-out and signed-in locations;
- web document-language updates;
- absence of an indefinitely pending initialization state.

Use `cimode` selectively when stable translation keys improve end-to-end targeting. Tests proving user-visible copy, accessibility names, fallback behavior, or formatting must use real Spanish and English resources rather than `cimode`.

### Manual verification

Verify language detection, switching, persistence, layout, and accessibility on:

- web at representative phone and desktop widths;
- iOS;
- Android;
- compact-height landscape and tablet layouts when affected.

Record untranslated, clipped, or ambiguous copy as defects. A screen displaying raw keys is a missing-translation failure.

## Deferred decisions

Do not add these capabilities as part of issue #58:

- a translation management system;
- HTTP, filesystem, or chained translation backends;
- local resource caching beyond the normal application bundle;
- runtime `saveMissing` or `updateMissing`;
- over-the-air translation changes;
- cross-device language preference synchronization;
- region-specific Spanish or English resource variants;
- translation of transactional emails, legal content, or user-authored product data;
- ICU, Fluent, sprintf, interval-plural, or other postprocessors without a concrete product requirement.

Revisit a translation management system when multiple translators need concurrent workflows, translation-only releases become necessary, or Git-managed resources become operationally costly.

## Primary references

- [i18next consolidated documentation](https://www.i18next.com/llms-full.txt)
- [Configuration options](https://www.i18next.com/overview/configuration-options)
- [TypeScript](https://www.i18next.com/overview/typescript)
- [Interpolation](https://www.i18next.com/translation-function/interpolation)
- [Formatting](https://www.i18next.com/translation-function/formatting)
- [Plurals](https://www.i18next.com/translation-function/plurals)
- [Nesting](https://www.i18next.com/translation-function/nesting)
- [Translation resolution](https://www.i18next.com/principles/translation-resolution)
- [Namespaces](https://www.i18next.com/principles/namespaces)
- [Fallback](https://www.i18next.com/principles/fallback)
- [Extracting translations](https://www.i18next.com/how-to/extracting-translations)
- [Migration guide](https://www.i18next.com/misc/migration-guide)
