<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Overview

This repository is a customizable **Tebex storefront theme**: a Next.js template that renders a game/community store (categories → packages → package detail) backed by the [Tebex Headless API](https://docs.tebex.io/developers/headless-api/overview). It's meant to be forked or copied by store owners and reskinned — the goal is a clean, minimal starting point, not a feature-complete e-commerce app. There is currently no basket/checkout flow; the app is browse-only (list packages, view package detail). Any basket/checkout work would be new functionality, not a gap in an existing pattern.

# Architecture

- **Next.js 16 App Router**, React 19. Routes live under `app/` using the file-based convention (`page.tsx`, `layout.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`).
- **Server Components by default.** Every route (`app/page.tsx`, `app/layout.tsx`, `app/category/[id]/page.tsx`, `app/package/[id]/page.tsx`) is an `async` Server Component that fetches its own data directly — no client-side data fetching, no route handlers/API routes exist or are needed.
- **`"use client"` only where React requires it.** In this codebase that's exactly `app/error.tsx` and `app/global-error.tsx`, because Next.js error boundaries must be Client Components. There is no other client-side interactivity (no `useState`, no event-driven UI) — don't add `"use client"` to a component just to be safe.
- **Pages own data fetching; components are presentational.** Pages/layout call into `lib/tebex` and pass plain data down as props (e.g. `app/page.tsx` fetches `webstore`/`categories` and passes them to `<Hero>` and `<CategoryGrid>`). Components under `components/` never call `fetch` or import from `lib/tebex`'s functions — they only import types from `lib/tebex/types` and render what they're given.
- **Typed routes.** Route params and layout props use Next 16's generated helpers (`PageProps<"/category/[id]">`, `LayoutProps<"/">`) instead of hand-written prop types — follow this pattern for any new route.
- `generateMetadata` is used per-route for `<title>`/`<meta description>` (and once in `layout.tsx` for the sitewide title template and Open Graph defaults), sourced from the same Tebex data the page itself fetches.

# Project Structure

- `app/` — routes only (pages, layout, error/not-found boundaries, global CSS entry). No business logic lives here beyond composing `lib/tebex` calls and passing props to components.
- `components/` — presentational, prop-driven UI. See "Component Organization" below for how it's subdivided.
- `lib/tebex/` — the sole Tebex data-access layer: `index.ts` (application-facing fetch functions), `client.ts` (the `openapi-fetch` wrapper), `mapper.ts` (normalizes generated schema shapes into domain types), `types.ts` (domain types), `generated/schema.ts` (OpenAPI-generated types, not hand-edited). See "Tebex Integration".
- `themes/` — CSS files defining design tokens (colors, radius, spacing) as custom properties. `default.css` is the shipped theme; alternate themes are sibling files swapped via one `@import` in `app/globals.css`.

Don't introduce a `hooks/`, `services/`, `utils/`, or similar generic top-level folder unless there's already code that needs it — the current structure has stayed flat on purpose.

# Component Organization

- Components are grouped by **domain**, not by type: `components/category/` (`category-card.tsx`, `category-grid.tsx`) and `components/package/` (`package-card.tsx`, `package-detail.tsx`, `package-price.tsx`) each exist because that domain has multiple related components worth grouping.
- Components with no siblings stay as flat files at the top of `components/` — `header.tsx` and `footer.tsx` are not nested in `components/header/` or `components/layout/` because each is a single file. Don't create a folder for a component until a second, related component justifies it.
- Every component takes its data as props (e.g. `PackageCard({ pkg, currency })`); none of them fetch, none of them reach into global state. `PackagePrice` is the one small extraction that exists purely because currency formatting (`Intl.NumberFormat`) is repeated between `PackageCard` and `PackageDetail` — that's the bar for pulling something into its own component: real, demonstrated duplication, not anticipated reuse.

# Styling

- **Tailwind v4**, CSS-first config — there is no `tailwind.config.ts`. `app/globals.css` does `@import "tailwindcss"` followed by `@import "../themes/default.css"`, then an `@theme inline` block that maps theme CSS variables (`--background`, `--primary`, `--radius`, `--section-spacing`, …) onto Tailwind utility names (`bg-background`, `text-primary`, `rounded-lg`, `py-section`).
- **Theme values live in `themes/*.css`** as plain CSS custom properties, with light values in `:root` and dark values in an `@media (prefers-color-scheme: dark)` block. Reskinning the store means copying `themes/default.css`, editing the variable values, and repointing the `@import` in `app/globals.css` — no component changes required. This is documented in `README.md`; keep that doc in sync if the token set changes.
- **Use theme utilities, not hardcoded values**, so themes stay swappable: `text-foreground` / `text-muted-foreground` / `bg-card` / `border-border` / `text-primary`, not raw Tailwind color scales like `text-zinc-950`.
- All `<Image>` usages pass `unoptimized`. This is deliberate, not an oversight: package/logo images come from whatever CDN domain the store's own Tebex account uses, which isn't known ahead of time — `next.config.ts` can't pre-register `images.remotePatterns` for a domain that varies per deployment of this theme. Keep `unoptimized` on any new `<Image>` that renders Tebex-supplied media.

# Tebex Integration

- `lib/tebex/index.ts` is the application's only interface to the Tebex Headless API, and the only file that should be imported from `app/`. It exposes four functions — `getWebstore`, `getCategories`, `getCategory(id)`, `getPackage(id)` — that return app-facing domain types, not raw API responses.
- Requests are made through `openapi-fetch`, typed against `lib/tebex/generated/schema.ts` (generated from Tebex's published OpenAPI spec via `npm run generate:tebex-types`; regenerate rather than hand-edit — see that file's own "do not edit" banner). `lib/tebex/client.ts` is the thin handwritten wrapper: it builds the token-scoped base URL from `TEBEX_PUBLIC_TOKEN`, creates the `openapi-fetch` client, and centralizes response resolution (`resolveTebexResponse`) — mapping expected "not found" statuses to `null` and throwing on anything else. Requests are cached via `next: { revalidate: 300 }`.
- **The data flow is: generated schema → `lib/tebex/mapper.ts` → domain types (`lib/tebex/types.ts`) → components.** `index.ts` calls the generated client via `client.ts`, then hands the raw response to a `map*` function (`mapWebstore`, `mapCategory`, `mapPackage`) before returning it. Nothing outside `lib/tebex/` imports `generated/schema.ts` — components only ever see `lib/tebex/types.ts` shapes.
- **`lib/tebex/types.ts` is deliberately not a mirror of the generated schema.** The generated types describe everything Tebex's Headless API can return (baskets, coupons, gift cards, tiers, dynamic packages, sidebar modules, creator metadata, ...); the domain types describe only what this storefront renders. Don't add a field to a domain type just because Tebex exposes it — add it when a component actually needs it, the same bar used elsewhere in this file for components and folders.
- **`lib/tebex/mapper.ts` is the only place that normalizes schema/runtime mismatches.** Since the generated schema marks every field optional, each `map*` function fills in a documented default for any field that's missing or malformed rather than trusting the type. Known mismatches handled there: `Package.type` is typed as a plain `string` in the schema (not a `"subscription" | "single"` union) even though those are the only real values; `Category.display_type` defaults anything other than `"list"` to `"grid"`; `Webstore.supports_usernames`/`supports_gifting` are returned by the live API but aren't declared in the generated schema at all (re-run `npm run generate:tebex-types` periodically to check if this has been fixed upstream); `Category.packages` is typed as nullable (`Package[] | null`), not just optional, and normalizes to `[]` either way; `Package.media` items with no `url` are silently dropped rather than mapped through with an empty string, since a `PackageMedia` without a URL isn't renderable. This normalization behavior is covered by `lib/tebex/mapper.test.ts` — extend those tests, not just the mapper, when adding a new mismatch to handle.
- Tebex's API is inconsistent about "not found" status codes per endpoint (a bad category ID returns 422, a bad package ID returns 400, not 404). `getCategory`/`getPackage` account for this explicitly via the `notFoundStatuses` parameter to `resolveTebexResponse`, returning `null` so pages can call `notFound()`. Follow this pattern (explicit expected-status allowlist, not blanket `try/catch`) for any new Tebex endpoint.
- The single-category and single-package endpoints reuse `CategoryResponse`/`PackageResponse` (typed `data: Category[]`/`Package[]`) even though the live API returns one object, not an array. `getCategory`/`getPackage` in `index.ts` cast just that one shape mismatch (`result.data as unknown as components["schemas"]["Category"]`, etc.) before handing the object to the mapper — this is the one documented, narrowly-scoped cast in the codebase; don't add others without an equivalent comment explaining the specific schema/runtime disagreement.
- **Adding a new Tebex endpoint:** add the fetch call to `index.ts` (via `tebexClient()` + `resolveTebexResponse`), add a `map*` function to `mapper.ts` if the response needs normalizing into a new or existing domain shape, and add/extend the relevant type in `types.ts` with only the fields the feature actually needs.
- There is no basket, checkout, or auth integration yet; `PackageType` (`"subscription" | "single"`) is modeled but not currently used to change rendering anywhere. The OpenAPI spec covers baskets, coupons, gift cards, creator codes, tiered/dynamic categories, and sidebar modules — none implemented here, and several (`getUserTieredCategories`, `updateTier`) require basic-auth private-key credentials this app doesn't have. Don't build speculative basket/cart plumbing unless asked.

# Development Philosophy

- **Prefer the simple, direct solution.** Pages call `lib/tebex` functions directly and pass the results straight through as props — no repositories, no data-fetching hooks, no client-side cache layer. Don't add one of these unless a concrete requirement (e.g. client-side interactivity that needs revalidation) demands it.
- **Don't abstract before duplication actually hurts.** `PackagePrice` exists because two components needed identical formatting logic — that's the bar. Two or three similar-but-not-identical blocks of JSX across pages is fine; a shared component isn't automatically better than duplication if it adds coupling for cosmetic similarity.
- **No UI/component libraries.** Styling is hand-written Tailwind utilities against theme tokens; there's no shadcn/Radix/MUI dependency to reach for. Keep it that way unless the user asks to add one.
- **Folders are earned, not default.** A domain gets a `components/<domain>/` folder once it has more than one component; a single component stays a flat file. Don't pre-create empty structure for anticipated future components.
- **Keep business/data logic out of `components/`.** If you find yourself wanting `fetch`, env vars, or Tebex-specific branching inside a component, that logic belongs in the page or in `lib/tebex` instead.

# Testing

- **Vitest** is the test framework, run via `npm run test` (once) or `npm run test:watch` (watch mode). Config is `vitest.config.mts` (jsdom environment, `@/` alias matching `tsconfig.json`) and `vitest.setup.ts` (registers `@testing-library/jest-dom`'s matchers). As of v0.1.3 this is infrastructure only — `test/smoke.test.tsx` proves the setup works and is not a template for feature tests; it should not be extended.
- **Tests live next to the code they test**, not in a mirrored test tree: `lib/tebex/mapper.test.ts` beside `mapper.ts`, `components/package/package-price.test.tsx` beside `package-price.tsx`. The top-level `test/` folder is reserved for cross-cutting setup/infrastructure only.
- **Vitest cannot render `async` Server Components** (a Vitest/React ecosystem limitation, not something this config can work around — see the [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)). Every route under `app/` (`page.tsx`, `layout.tsx`) is an async Server Component per this project's architecture, so **unit tests only ever target `components/*`** (which are synchronous and prop-driven by design) or plain functions in `lib/`. Don't attempt to `render()` an `app/**/page.tsx` in a Vitest test — it won't work, and testing that layer would need E2E tooling, which is out of scope until explicitly decided.
- **Use React Testing Library for component behavior** (`@testing-library/react`, already installed) — query by role/text the way a user would, not by internal component state or implementation details.
- **Prefer behavior testing over implementation testing.** Assert on what a component renders or what a function returns, not on how it's implemented internally — implementation details should be free to change without breaking tests.
- **Do not test Next.js internals.** Don't write tests asserting on App Router routing behavior, `generateMetadata` internals, or framework plumbing — trust Next.js to do its job; test this app's own logic and rendering.
- **Do not call external APIs in tests**, including the real Tebex Headless API. Tests must not depend on `TEBEX_PUBLIC_TOKEN` or network access — future `lib/tebex` tests should exercise `mapper.ts`'s normalization logic against inline fixture data, not live requests.
- **Add tests incrementally as functionality is introduced or changed** — this is not a retroactive coverage push. There is no coverage threshold enforced; write a test when it's the natural way to pin down behavior you're adding or fixing.

# Repository-Specific Guidance

- Biome (`biome.json`) is the linter/formatter — run `npm run lint` (`biome check`) and `npm run format` (`biome format --write`). There is no separate ESLint/Prettier config to reconcile with.
- There is no test runner configured in this repo (no Jest/Vitest, no test files). Don't assume a `npm test` script exists.
- `TEBEX_PUBLIC_TOKEN` (see `.env.example`) is required for any local run — every route fetches from Tebex at request/build time and will throw if it's unset.
- `npm run generate:tebex-types` regenerates `lib/tebex/generated/schema.ts` from Tebex's remote OpenAPI spec and reformats it. Run it after a Tebex API change; the YAML itself is not vendored into the repo.
- Every route delegates its presentational markup to a component (`CategoryGrid`/`CategoryDetail`, `PackageDetail`) rather than inlining JSX in `page.tsx` — the page's job is fetching data, resolving 404s, and composing components inside the shared `mx-auto max-w-6xl px-6 py-16` wrapper. Follow this for new routes rather than writing markup directly in the page.
- Every route that fetches data has a sibling `loading.tsx` (App Router convention — automatically wraps the page in a Suspense boundary). Each one is a self-contained pulsing skeleton shaped like that route's actual layout, not a shared/generic spinner component. Add one for any new data-fetching route.
- Known trade-off: because `/category/[id]` and `/package/[id]` now stream behind `loading.tsx`, Next.js sends the response headers (status `200`) before `notFound()` can run, so an invalid category/package ID responds with HTTP `200` and the not-found UI arrives via the stream rather than as a `404` status. The correct not-found content still renders (verified against a live store) — only the raw status code is affected. This is standard Next.js streaming behavior, not a bug in this app; don't try to "fix" it by removing the Suspense boundary.
- `.gitattributes` pins text files to LF. Don't remove it — without it, `npm run lint` fails on a fresh Windows clone because Biome expects LF but Windows checks out CRLF by default.


## Design Philosophy

This project prioritizes clarity over abstraction.

Build the simplest solution that accurately represents the Tebex domain. Avoid introducing layers, generic reusable components, or infrastructure until there is a demonstrated need.

Prefer feature-oriented organization, CSS-first customization, and explicit data flow from pages to presentational components.

This repository intentionally does not depend on a UI component library.

Do not introduce shadcn/ui, Radix UI, Headless UI, MUI, Chakra UI, or similar unless explicitly requested.

Prefer writing small, project-specific components.


## Feature-first organization

Prefer organizing code around Tebex domains rather than technical categories.

Examples:

- category/
- package/
- cart/
- navigation/

Avoid generic groupings such as:

- common/
- shared/
- layout/
- ui/

unless there is a demonstrated need.