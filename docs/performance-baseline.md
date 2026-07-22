# MVP Performance Baseline

Purpose: practical performance rules for the upcoming MVP feature layer
Source of truth for: performance expectations around app startup, navigation, lists, data fetching, uploads, and release review
Update when: routing strategy, data-fetching patterns, list architecture, image/upload workflow, or rendering approach changes
Last reviewed: 2026-07-22

## Scope

This baseline is focused on the next product phase:

- auth bootstrap and protected app entry
- project list and project detail screens
- task list and task CRUD flows
- uploads, photos, and file-heavy views

The goal is not premature optimization. The goal is to avoid predictable slowdowns while the app surface is still small enough to shape cleanly.

## Core principles

- startup should do as little work as possible
- screens should fetch only what they need
- large collections should be virtualized and paginated
- images and uploads should be treated as a first-class performance concern
- perceived performance matters as much as raw speed

## Startup and auth bootstrap

The app should reach the first meaningful screen quickly.

Baseline rules:

- keep root layout work minimal
- avoid fetching non-essential product data during auth/bootstrap
- resolve session state first
- fetch screen-specific data after the route is known
- avoid mounting heavy providers unless they are truly global

Preferred startup shape:

1. initialize runtime essentials
2. resolve auth/session state
3. render the correct route
4. load feature data for that route

Avoid:

- loading project/task data in the global app root
- blocking first paint on non-critical requests
- large synchronous setup work during route resolution

## Navigation performance

Moving between screens should feel immediate.

Baseline rules:

- do not block navigation on secondary data requests
- prefer progressive loading over delayed screen entry
- keep route-level mount work light
- use loading states instead of waiting for all data before rendering

When opening a project or task:

- render the shell quickly
- load secondary content after initial screen structure is visible

## Data fetching

Most future performance problems will come from fetching too much or refetching too often.

Baseline rules:

- query only the columns a screen actually needs
- separate list queries from detail queries
- require pagination for every entity collection request, including workflows that eventually traverse every page
- enforce bounded default and maximum page sizes at the repository boundary
- use deterministic ordering with a unique tie-breaker so page boundaries remain stable
- avoid refetching entire parent records after small mutations
- avoid repeated requests triggered by trivial navigation changes
- reuse recent data when appropriate

Examples:

- project list should fetch summary fields only
- project detail can fetch expanded fields
- task status updates should not require refetching unrelated project sections

## Lists and dense collections

Projects, tasks, activity streams, and photos should be built for scale from the start.

Baseline rules:

- use `FlatList` or `SectionList` for long collections
- avoid rendering long arrays directly with `.map()` in screen bodies
- paginate or progressively load larger datasets
- never bypass repository pagination for map, export, admin, or background collection reads
- keep row and card components visually rich but structurally lightweight
- use stable keys
- minimize rerenders when a single row changes

High-priority list surfaces:

- project list
- project task list
- activity or update timeline
- photo list or gallery

## Rendering discipline

Slow-feeling screens often come from rerendering too much.

Baseline rules:

- keep state as local as practical
- avoid pushing fast-changing feature state into broad global context
- split large screens into smaller render boundaries
- keep render functions cheap
- avoid recalculating expensive derived data during every render

Avoid:

- mega-screens where every task update rerenders the whole project detail view
- top-level state that forces unrelated sections to rerender

## Images, files, and uploads

This is one of the most important performance areas for `onzait`.

Baseline rules:

- do not use full-resolution images in lists when a smaller display size will do
- compress images before upload when practical
- generate or store display-friendly variants if needed
- lazy-load image-heavy sections
- limit concurrent uploads
- keep upload feedback responsive without freezing the screen

Recommended behavior:

- thumbnails or smaller previews in lists
- full image only on detail/open view
- visible upload progress
- recoverable failure states for slow or interrupted uploads

## Web performance

Because the app is also usable on web, bundle size and first load matter.

Baseline rules:

- keep public web pages lighter than authenticated app surfaces
- avoid importing heavy modules in top-level shared entry files unless necessary
- be careful with large UI or utility dependencies
- avoid shipping unnecessary code to public-facing routes

Current enforced export budgets:

- initial JavaScript: at most 4,500,000 raw bytes and 1,100,000 gzip bytes
- initial CSS: at most 100,000 raw bytes
- authenticated feature screens and heavy optional integrations should use route or interaction-level code splitting when it reduces the initial graph

Current production-export baseline after icon and font delivery optimization:

- initial JavaScript: 3,937,249 raw bytes, 961,331 gzip bytes, and 754,219 Brotli bytes
- web uses Google-hosted Geist and JetBrains Mono from `global.css`; iOS and Android load the tracked local TTF files through the platform-specific app-font hook
- web must not register or preload the native TTF assets
- screens and components import named app icons and icon types only from `@/shared/ui/icons`; the central registry alone imports Lucide's individual ESM icon modules so Metro does not bundle the complete catalog

Run `npm run build` followed by `npm run bundle:check` after changing shared dependencies, route imports, NativeWind content paths, or font loading.

## Perceived performance

A responsive-feeling product is often more important than a technically perfect loading profile.

Baseline rules:

- prefer skeletons or immediate structure over blank states
- distinguish initial loading from background refresh
- do not block the whole screen for small mutations
- show optimistic or fast local feedback where safe

Examples:

- marking a task complete should not freeze the entire task list
- opening a project should show the layout immediately even if sections are still loading

## Database and query design

Frontend performance depends on backend and database shape.

Baseline rules:

- design tables and indexes around real screen queries
- review common filter and sort paths early
- avoid unnecessarily expensive query shapes
- keep access control correct, but also think about efficient policy-aware queries

Important future query shapes:

- list projects for current user
- load project details by participant access
- list tasks by project, status, assignee, or due date
- list photos or uploads by project

## Measurement and monitoring

You do not need a full performance platform yet, but you should track a few signals early.

Recommended signals:

- auth-to-first-screen time
- project list load time
- project detail load time
- task list load time
- image upload duration
- web bundle growth over time

Use Sentry and local verification to watch for:

- slow startup
- slow data-heavy screens
- repeated avoidable errors during upload or navigation

## Feature review checklist

Before shipping a new screen or flow, confirm:

- startup work was not expanded unnecessarily
- the screen fetches only the fields it needs
- long collections are virtualized
- loading and error states exist
- image-heavy content uses appropriate preview sizing
- small mutations do not trigger whole-screen loading

## Non-goals for now

This baseline does not yet require:

- complex profiling on every feature
- exhaustive benchmarking
- micro-optimizing every component
- advanced caching infrastructure

Those may matter later. For now, the priority is preserving a fast-feeling, mobile-friendly MVP while the feature set grows.
