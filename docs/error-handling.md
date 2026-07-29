# Error-handling baseline

Purpose: define how Onzait classifies, records, and presents failures
Source of truth for: user-visible error copy, provider-error translation, retry states, and permission-denial behavior
Update when: error types, monitoring boundaries, provider integrations, or critical async flows change
Last reviewed: 2026-07-29

## Product rule

Every error shown to a user must be clear, actionable, and written in product language. Never render a raw provider, database, HTTP, SDK, or exception message in the interface.

Good messages explain what the user was trying to do and the safest next action:

- `We couldn't load this project. Check your connection and try again.`
- `Photo access is disabled. Enable it in your device settings, then try again.`
- `Your session has expired. Sign in and try again.`

Do not expose implementation wording such as table names, SQL constraints, RLS policies, bucket paths, environment-variable names, stack traces, provider configuration, or internal response bodies.

## Translation boundary

- Branch on stable structured fields such as Supabase Auth `code`, PostgREST/Postgres `code`, Storage `statusCode` and error name, or an application-owned error code.
- Do not branch on provider message text. Provider wording is unstable and may include sensitive implementation detail.
- Translate raw failures at the repository, service, or shared error boundary before they reach UI code.
- Use `UserFacingError` for application-approved product copy and preserve the original failure as its `cause` for diagnostics.
- UI catches must call `getUserFacingErrorMessage(error, actionSpecificFallback)` rather than rendering `error.message`.
- Unknown errors always use an action-specific fallback. They must never fall through to raw wording.

## Diagnostics and monitoring

User-friendly copy and technical diagnostics serve different audiences:

- show only translated product copy in the interface
- retain the original error or `cause` for Sentry and server logs
- log complete provider errors only to trusted diagnostics, never to UI, URLs, analytics properties, or public responses
- avoid including secrets, tokens, personal data, SQL payloads, or signed URLs in diagnostics

Supabase Edge Functions must return controlled public error bodies. Unexpected exceptions should be logged server-side and replaced with a stable generic response.

## Async state requirements

Every user-critical query must distinguish:

- loading
- successful data
- empty or genuinely not-found data
- request failure

A request failure must not be presented as an empty or not-found result. Provide a dedicated error state with a retry action when retrying is safe. Mutation errors must remain visible near the action or form until the user retries or changes the relevant input.

Loading UI must correspond to active work that can settle. A missing or invalid
required route parameter is an invalid-route state, not a loading state. It must
render finite, actionable feedback and a safe navigation action; it must never
leave the user on an indefinite spinner or skeleton.

## Record routes and authorization

- Validate required route parameters before starting record queries or
  permission-dependent workflows.
- When RLS intentionally makes a missing record and an inaccessible record
  indistinguishable, show the shared privacy-preserving “not found or you may
  not have access” result.
- When the application can safely read a record but the current user lacks the
  capability required by the requested route, show an explicit unavailable or
  unauthorized state instead of rendering controls that will fail on submit.
- Apply UI authorization to direct navigation as well as links and buttons.
  Hiding a navigation action is not sufficient because users can enter or
  modify URLs manually.
- Database authorization remains authoritative. UI route guards improve
  feedback and must never replace RLS or capability assertions.

### Shared route feedback system

Dynamic record routes use
`shared/utils/route-params.ts#parseRequiredUuidRouteParam` before enabling
queries. Missing and malformed identifiers resolve to `null`; they are never
sent to Supabase and never represented as loading.

Wrap dynamic record content in
`shared/ui/components/route-feedback.tsx#RouteStateBoundary`. The boundary
selects the first active state in this fixed order: invalid parameters, loading,
load error, not found, forbidden, then content.

| Kind             | Use when                                                                       | Retry          |
| ---------------- | ------------------------------------------------------------------------------ | -------------- |
| `invalid-params` | A required route identifier is missing or malformed                            | No             |
| `not-found`      | RLS returns no readable row, including missing, archived, or concealed records | No             |
| `forbidden`      | The record is safely readable but the requested route capability is absent     | No             |
| `load-error`     | An active query or permission lookup fails                                     | Yes, when safe |

Pass state-specific actions, descriptions, titles, and icons through the
boundary's `feedback` overrides. `RouteFeedback` is the presentation primitive
owned by the boundary; feature screens should not repeat route-state return
branches.

Keep queries and capability hooks in the route container. Place the usable
screen in a child content component when it needs guaranteed records or
permissions. The boundary does not fetch data, catch render failures, or replace
React error boundaries.

Route failures, inline query failures, and empty collections are separate UI
states:

- `RouteFeedback` replaces the entire page when its route cannot produce usable
  content, including malformed or missing identifiers, concealed/missing
  records, forbidden routes, initial page-query failures, and unmatched URLs.
  It must not render or import `EmptyState`.
- `InlineErrorState` appears inside a page or section that loaded successfully
  when one subordinate query failed. The surrounding header, search, sort,
  filters, and safe actions remain available.
- `EmptyState` is only for a successfully loaded, authorized collection or
  section with zero rows, including zero filtered matches. Keep applicable
  search, sort, filter, and create controls visible around it.

A request failure is never an empty state, and a missing or inaccessible record
is never described as an empty collection.

Use `isForbidden` only for readable content that requires an additional
capability, such as project or client editing. Do not use it to infer whether an
RLS-hidden record exists.

The route contract test enforces three invariants:

- `RouteLoadingScreen` appears only as a `Suspense` fallback.
- Every currently registered dynamic record route validates its UUID before
  record queries begin.
- Dynamic record screens use `RouteStateBoundary` for terminal route states.
- Route feedback is presentation-independent from collection empty states, and
  the unmatched URL route uses route feedback.

## Permission denial

Never stop silently after a denied device permission. Explain:

- which permission is needed
- which action requires it
- whether the user can retry the prompt
- when the user must enable access in device settings

Canceling a picker or system sheet is not an error and should remain quiet.

## Verification checklist

- tests cover stable-code mappings and confirm unknown technical messages use the supplied fallback
- query failure and not-found paths are reviewed separately
- denied permission paths display guidance on iOS, Android, and web where applicable
- `rg "error\\.message"` does not find UI rendering or UI state assignment of raw exception messages
- provider and Edge Function responses do not forward unexpected exception messages
