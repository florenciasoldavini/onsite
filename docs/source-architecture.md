# Source Architecture

Purpose: define where product code belongs and which dependency directions are allowed
Source of truth for: feature ownership, shared code, infrastructure boundaries, and new-feature scaffolding
Update when: a new source layer is introduced or an ownership boundary changes
Last reviewed: 2026-07-29

## Canonical Structure

```text
app/                         Expo Router routes and layouts
features/                    Product domains
  <feature>/
    components/              Feature-only presentation
    constants/               Feature-owned stable values and labels
    errors/                  Feature-specific structured errors
    screens/                 Route-level product UI
    hooks/                   React state, React Query, and mutations
    providers/               Feature-owned React context state
    services/                Product workflows and orchestration
    repositories/            Raw persistence and external transport
    schemas/                 Runtime validation
    tests/                   Feature workflow and boundary tests
    types/                   Domain contracts
    utils/                   Pure feature-only helpers
shared/                      Product-agnostic reusable code
  hooks/
  splash/
  tests/
  theme/
  ui/
    components/              Onzait design-system components
    forms/                   Shared form composition
    icons/                   Central icon registry
    primitives/              Gluestack-generated primitives
  utils/
infrastructure/              SDK clients and technical adapters
  monitoring/
  query/
  supabase/
assets/                      Static app assets
docs/                        Maintained project documentation
scripts/                     Repository automation
supabase/                    Migrations, database tests, and Edge Functions
```

Feature directories may omit layers they do not need. Do not create empty folders merely to complete the template. Feature roots contain responsibility directories only; implementation modules should not be left loose at the feature root.

File-backed product domains follow the same dependency rule. For example, `features/documents` owns document screens, hooks, workflows, row/Storage repositories, validation, types, and platform-specific open/download adapters; its routes only normalize project IDs and delegate to those screens.

## Dependency Direction

```text
app route
  -> feature screen or component
    -> feature hook or service
      -> feature repository
        -> infrastructure client, Storage, or Edge Function
```

- Routes should contain route declarations, parameter normalization, guards, and delegation only.
- Screens and components must not import repositories or infrastructure directly.
- Hooks own React Query/cache behavior and call services.
- Services own product workflows and may compose repositories.
- Repositories own raw SDK, database, Storage, and external transport calls.
- Providers own React context state and call hooks or services rather than repositories or infrastructure.
- Shared code must not import a product feature.
- Cross-feature code must use the owning feature's hook, service, provider, or exported type; repository internals are not a cross-feature API.

ESLint enforces the most important import boundaries in `eslint.config.js`.

## Route Declarations

Every non-layout file under `app/` uses the same explicit wrapper shape:

```tsx
import ClientDetailScreen from "@/features/clients/screens/client-detail-screen";
import { parseRequiredUuidRouteParam } from "@/shared/utils/route-params";
import { useLocalSearchParams } from "expo-router";

export default function ClientDetailRoute() {
  const params = useLocalSearchParams<{
    clientId: string | string[];
  }>();
  const clientId = parseRequiredUuidRouteParam(params.clientId);

  return <ClientDetailScreen clientId={clientId ?? undefined} />;
}
```

- Name the default route component `<Purpose>Route`. Do not directly export a screen or use a default re-export.
- `app/` owns Expo Router inputs. Read and normalize path parameters, query parameters, and URL fragments in the route, then pass ordinary typed props to the feature screen.
- Use `firstRouteParam` for a repeated scalar query parameter, `parseRequiredUuidRouteParam` for a required UUID path parameter, and `parseOptionalUuidRouteParam` for an optional UUID query parameter.
- A missing or malformed required identifier is passed to the screen as `undefined`; the screen's `RouteStateBoundary` then renders finite invalid-route feedback without starting a record query.
- Feature screens may use navigation actions such as `useRouter`, but must not use `useLocalSearchParams` or parse URL fragments.
- Route files contain declarations, parameter normalization, route-specific guards, and screen delegation only. Domain behavior and product UI stay in the feature.
- Deliberate `React.lazy` bundle boundaries are allowed, but the route still follows the same explicit wrapper and parameter ownership rules.
- Layout files use named `<Purpose>Layout` components. The root layout's monitoring wrapper is the only default-export expression exception.

## Screen Composition

A screen coordinates the lifecycle of an entire page. It owns page-level queries, permissions, navigation outcomes, and the full-page `RouteStateBoundary`, then delegates the successfully loaded presentation to feature components.

For a substantial page, colocate its visual sections under a component family:

```text
features/projects/
  screens/
    project-detail-screen.tsx
  components/
    project-detail/
      project-detail-content.tsx
      project-detail-header.tsx
      project-client-card.tsx
      project-progress-card.tsx
      project-action-grid.tsx
      project-detail-skeleton.tsx
      project-detail.styles.ts
```

- Keep invalid, loading, load-error, forbidden, not-found, and successful-content precedence visible in the screen.
- Pass guaranteed successful data to the content component instead of repeating nullable checks throughout the page.
- Extract a recognizable page section when it has its own interaction state, query or mutation, responsive layout, substantial styles, or independently testable behavior.
- Screen modules contain one screen component. Secondary React components, pure helper functions, and `StyleSheet.create` definitions belong in the screen's colocated component family or feature utilities.
- Keep small one-off markup in the screen or its nearest section; do not create components solely to reduce line count.
- Section components may consume feature hooks when the state belongs to that section. Services still own product workflows, and query hooks still own server/cache behavior.
- Put screen-family constants and styles beside that component family when they are not reused by the broader feature.
- Do not replace a large screen with one opaque `use<ScreenName>Controller` hook. The page lifecycle and data dependencies should remain directly readable.
- Treat roughly 100–250 lines as a review signal for a screen, not a hard limit. A complex form or virtualized collection coordinator may remain longer when it still has one responsibility and extraction would create an opaque prop interface.

## Model Ownership

Each domain contract belongs to the feature that will implement it. Planned contracts are preserved in their future owner, such as `features/workers/types/` or `features/materials/types/`, instead of a global model directory.

An active entity must have one canonical TypeScript contract. Zod schemas validate that contract from the same feature; emitted `.js`, `.d.ts`, and source-map copies must not be committed beside TypeScript source. TypeScript runs with `noEmit` for the Expo application.

## Adding A Feature

1. Create `features/<feature>/` with only the layers required by the first implemented behavior.
2. Place route-level UI under `features/<feature>/screens/` and add a thin route under `app/`.
3. Keep platform variants beside the shared module using Expo suffixes such as `.web.tsx`, `.ios.tsx`, or `.android.tsx`.
4. Put reusable code in `shared/` only when it is genuinely product-agnostic or already needed by more than one feature.
5. Add unit, flow, and database/RLS tests appropriate to the feature.

## Adaptive Presentation

Onzait shares routes, feature state, hooks, services, and repositories across supported devices while allowing layout-specific navigation and feature presentations. Reusable layout classification and application-shell primitives belong under `shared/`; feature-specific compact, medium, or expanded presentations belong to the owning feature.

Use platform-specific files for genuine platform implementation differences, not as a substitute for width-driven adaptation. The complete layout contract, navigation model, presentation rules, and verification matrix live in [adaptive-layout-strategy.md](./adaptive-layout-strategy.md).

## Naming

- Directories and non-component modules use kebab-case.
- React components use named PascalCase exports; Expo Router files default-export an explicit named route or layout component.
- Services use `.service.ts`, repositories use `.repository.ts`, and runtime schemas use `.schema.ts` or `.schemas.ts`.
- Avoid generic catch-all directories such as `lib/` and global layer directories such as `screens/`, `services/`, or `types/models/`.
