<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Overview

This repository is a customizable **Tebex storefront theme**: a Next.js template that renders a game/community store (categories → packages → package detail) backed by the [Tebex Headless API](https://docs.tebex.io/developers/headless-api/overview). It's meant to be forked or copied by store owners and reskinned — the goal is a clean, minimal starting point, not a feature-complete e-commerce app.

The current release is browse-only: list categories, list packages within a category, view a package's detail page. There is no basket, checkout, authentication, or gifting flow yet. Any work in that direction is new functionality, not a gap in an existing pattern — see the Tebex Integration section for what the API surface already covers but this app doesn't use.

# Architecture

- **Next.js 16 App Router**, React 19, TypeScript. Routes live under `app/` using the file-based convention (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`), alongside file-convention metadata routes (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`).
- **Server Components by default.** Every route's `page.tsx`/`layout.tsx` is an `async` Server Component that fetches its own data directly — there's no client-side data fetching and no route handlers/API routes in the app.
- **Client Components are the exception, used only where React requires them.** `app/error.tsx` and `app/global-error.tsx` are `"use client"` because Next.js error boundaries must be Client Components; that's the only interactivity requirement (`reset()` on a button) anywhere in the app. Reach for a Client Component when a feature genuinely needs browser-only APIs or event handlers — not as a default.
- **Pages own data fetching; components are presentational.** Pages/layout call into `lib/tebex` and pass plain data down as props (e.g. `app/page.tsx` fetches `webstore`/`categories` and passes them to `<Hero>` and `<CategoryGrid>`). Components under `components/` don't call `fetch` or import from `lib/tebex`'s functions — they import only types from `lib/tebex/types` and render what they're given. This keeps the data-fetching boundary at the page/layout level and components trivially testable.
- **Typed routes.** Route params and layout props use Next 16's generated helpers (`PageProps<"/category/[id]">`, `LayoutProps<"/">`) instead of hand-written prop types.
- `generateMetadata` is used per-route for `<title>`/`<meta description>`, sourced from the same Tebex data the page itself fetches. `layout.tsx` additionally sets the sitewide title template, Open Graph/Twitter defaults, and `metadataBase` (from `SITE_URL`). `robots.ts`, `sitemap.ts`, and `opengraph-image.tsx` build on the same `lib/tebex` calls to produce the rest of the SEO surface (sitemap entries per category/package, a generated OG image from the store's name/logo).

# Repository Structure

- `app/` — routes and route-convention files only (pages, layout, loading/error/not-found boundaries, metadata routes, global CSS entry). Business logic beyond composing `lib/tebex` calls and passing props to components belongs elsewhere.
- `components/` — presentational, prop-driven UI, organized by Tebex domain (see below).
- `lib/tebex/` — the Tebex data-access layer: `index.ts` (application-facing fetch functions), `client.ts` (the `openapi-fetch` wrapper and response resolution), `mapper.ts` (normalizes generated schema shapes into domain types), `types.ts` (domain types), `generated/schema.ts` (OpenAPI-generated types, not hand-edited). See "Tebex Integration" below.
- `themes/` — CSS files defining design tokens (colors, radius, spacing) as custom properties. `default.css` is the shipped theme; alternate themes are sibling files swapped via one `@import` in `app/globals.css`.
- `test/` — cross-cutting test infrastructure only (currently a smoke test proving the Vitest/RTL setup renders). Feature test coverage lives next to the code it tests, not here.

## Component organization

Components are grouped by Tebex domain where a domain has more than one related component — `components/category/` (`category-card.tsx`, `category-grid.tsx`, `category-detail.tsx`) and `components/package/` (`package-card.tsx`, `package-detail.tsx`, `package-price.tsx`, `package-badge.tsx`). Components without siblings stay as flat files at the top of `components/` (`header.tsx`, `footer.tsx`, `hero.tsx`, `breadcrumbs.tsx`, `store-disabled-banner.tsx`).

Every component takes its data as props — none of them fetch, none of them reach into global state. `PackagePrice` is a small extraction that exists because currency formatting (`Intl.NumberFormat`, sale-price display) is identical between `PackageCard` and `PackageDetail`; it's a useful example of the bar for pulling something into its own component: real, demonstrated duplication rather than anticipated reuse.

# Styling

- **Tailwind v4**, CSS-first config — there is no `tailwind.config.ts`. `app/globals.css` does `@import "tailwindcss"` followed by `@import "../themes/default.css"`, then an `@theme inline` block that maps theme CSS variables (`--background`, `--primary`, `--radius`, `--section-spacing`, …) onto Tailwind utility names (`bg-background`, `text-primary`, `rounded-lg`, `py-section`).
- **Theme values live in `themes/*.css`** as plain CSS custom properties, with light values in `:root` and dark values in an `@media (prefers-color-scheme: dark)` block. Reskinning the store means copying `themes/default.css` (e.g. `themes/ocean.css`), editing the variable values, and repointing the `@import` in `app/globals.css` — no component changes required. This is documented in `README.md`; keep that doc in sync if the token set changes.
- Components use theme utilities (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-primary`, …) rather than raw Tailwind color scales, so that swapping a theme file actually changes the rendered colors.
- All `<Image>` usages pass `unoptimized`. This is deliberate: package/logo images come from whatever CDN domain the store's own Tebex account uses, which isn't known ahead of time — `next.config.ts` can't pre-register `images.remotePatterns` for a domain that varies per deployment of this theme. Keep `unoptimized` on any new `<Image>` that renders Tebex-supplied media.

# Tebex Integration

`lib/tebex/index.ts` is the application's interface to the Tebex Headless API — the file `app/` imports from. It currently exposes `getWebstore`, `getCategories`, `getCategory(id)`, and `getPackage(id)`, each returning app-facing domain types rather than raw API responses. Requests are cached via `next: { revalidate: 300 }`.

**Data flow:** generated schema → `lib/tebex/mapper.ts` → domain types (`lib/tebex/types.ts`) → components. `index.ts` calls the generated client via `client.ts`, then hands the raw response to a `map*` function (`mapWebstore`, `mapCategory`, `mapPackage`) before returning it. Nothing outside `lib/tebex/` imports `generated/schema.ts` directly — components only ever see `lib/tebex/types.ts` shapes.

**Generated types.** `lib/tebex/generated/schema.ts` is generated from Tebex's published [Headless API OpenAPI spec](https://github.com/tebexio/TebexHeadless-OpenAPI) via `npm run generate:tebex-types` (uses `openapi-typescript`, then reformats with Biome). The spec YAML itself isn't vendored — it's fetched from Tebex's GitHub repo at generation time. Regenerate after a Tebex API change rather than hand-editing the file; it carries its own "do not edit" banner and gets overwritten on every run.

**Domain types are deliberately not a mirror of the generated schema.** The generated types describe everything the Headless API can return (baskets, coupons, gift cards, tiers, dynamic packages, sidebar modules, creator metadata, ...); `lib/tebex/types.ts` describes only what this storefront currently renders. Add a field there when a component needs it, not because Tebex exposes it.

**Why the mapper exists.** The generated schema marks every field optional and — as this project has repeatedly found — doesn't guarantee a present field has the type the spec claims either. `mapWebstore`/`mapCategory`/`mapPackage` treat their input as fully untrusted (`unknown`) and validate every field by type, not just presence: a numeric ID sent as a string, a price that's `NaN`/`Infinity`, or a boolean sent as `"yes"` all fall back to the same documented default a missing field would get. None of the three ever throws — a malformed top-level argument (`null`, a primitive, an array) returns a fully-defaulted domain object. Malformed entries *inside* an array (a `null` in `Category.packages`, a string in `Package.media`) are dropped rather than defaulted, so one bad entry can't take down the rest of the list, but an empty object (`{}`) is kept and mapped to a fully-defaulted placeholder. The mapper doesn't coerce types (a numeric string stays invalid, not parsed) or enforce business rules (a negative price passes through unchanged) — only shape/type safety is its job.

Known schema/runtime mismatches currently handled in the mapper: `Package.type` is typed as a plain `string` (not a `"subscription" | "single"` union) even though those are the only real values; `Category.display_type` defaults anything other than `"list"` to `"grid"`; `Webstore.supports_usernames`/`supports_gifting` are returned by the live API but aren't declared in the generated schema at all (worth re-checking against a fresh `npm run generate:tebex-types` periodically); `Category.packages` is typed nullable and normalizes to `[]` either way; `Package.media` items with no `url` are dropped rather than mapped through with an empty string. This behavior is covered by `lib/tebex/mapper.test.ts` — extend those tests alongside the mapper when handling a new mismatch.

**Not-found handling.** Tebex is inconsistent about "not found" status codes per endpoint (a bad category ID returns 422, a bad package ID returns 400 — neither returns 404). `client.ts`'s `resolveTebexResponse` takes an explicit `notFoundStatuses` allowlist per call site, resolving to `null` so pages can call Next's `notFound()`; any other non-OK response throws. Follow this explicit-allowlist pattern (not a blanket `try/catch`) for new endpoints with the same quirk.

**The one documented cast.** The single-category and single-package endpoints reuse `CategoryResponse`/`PackageResponse` (typed `data: Category[]`/`Package[]`) even though the live API returns one object, not an array. `getCategory`/`getPackage` in `index.ts` cast just that one shape mismatch before handing the object to the mapper, with a comment explaining why. If a similar schema/runtime disagreement shows up elsewhere, document it the same way rather than casting silently.

**Adding a new endpoint:** add the fetch call to `index.ts` via `tebexClient()` + `resolveTebexResponse`, add a `map*` function to `mapper.ts` if the response needs normalizing, and extend `types.ts` with only the fields the feature actually needs.

**Unused surface.** The OpenAPI spec also covers coupons, gift cards, creator codes, tiered/dynamic categories, and sidebar modules — none implemented here yet. A few endpoints (`getUserTieredCategories`, `updateTier`) require basic-auth private-key credentials this app doesn't have. `PackageType` (`"subscription" | "single"`) is modeled in the domain types but not currently used to change rendering.

**Basket session & Server Actions.** `index.ts` also exposes `getBasket`, `createBasket`, `addPackageToBasket`, and `removePackageFromBasket` — read/write, never cached (`NO_STORE_OPTIONS`, not `CACHE_OPTIONS`, since basket data is per-visitor and mutates almost every request). Several schema-vs-runtime quirks worth knowing about before touching this code, all confirmed against a live store rather than assumed from the generated schema or Tebex's own docs:
- `Basket.id` comes back as a JSON number despite the generated schema typing it as a string — modeled as `number` here, same "trust behavior over spec" call already made for `Package.type`.
- `addPackageToBasket`/`removePackageFromBasket` return the `Basket` object directly, while `getBasket`/`createBasket` wrap it in `{ data }` — read the response differently per call, it's not a bug.
- `addPackageToBasket`/`removePackageFromBasket` live at `/baskets/{basketIdent}/packages...`, relative to the **bare API root** — not the account-scoped base (`/accounts/{token}/...`) every other call in this file uses, including `getBasket`/`createBasket`. Both the generated schema (which declares the path as `/{basketIdent}/packages`, missing a `baskets/` segment) and Tebex's own published docs (which claim account scoping applies here too) are wrong. Since no key in the generated `paths` type matches the real endpoint, these two calls use `client.ts`'s `basketPackageRequest` (a plain `fetch`, still funneled through `resolveTebexResponse`) instead of `tebexClient()`'s typed `GET`/`POST`.

A visitor's basket identity lives in an HTTP-only cookie, not a client-side store — see `lib/tebex/session.ts`. It's split into two functions rather than one "get or create" helper because Next.js only allows *setting* a cookie from a Server Action or Route Handler, never during Server Component render:
- `getCurrentBasket()` — read-only. Safe from Server Components, layouts, and Server Actions. Returns `null` rather than creating anything.
- `ensureBasket()` — read-or-create. Only callable from a Server Action/Route Handler. Call this first in any basket mutation to guarantee a valid basket before acting on it.

`lib/tebex/session.ts` is a sibling entry point to `index.ts` for basket/session state — it's fine for `app/` or a Server Action to import it directly, same as `index.ts`. It never talks to the Tebex API itself, only through `index.ts`'s functions.

Basket **mutations** (add to basket, apply a coupon, log in, ...) are Next.js Server Actions — plain `"use server"` functions, not a client-side API layer or global store. Convention: colocate a Server Action with the component that triggers it (e.g. `components/package/add-to-basket-action.ts` sits beside `add-to-basket-button.tsx`), in its **own file** when a Client Component will import it — a file can't mix `"use client"` and `"use server"`, and Next requires Server Functions used by a Client Component to live in a dedicated file. After a mutation succeeds, call `revalidatePath("/", "layout")` — broad on purpose, since basket state can affect UI (header count, `/cart`) on any page; narrow it to a specific path only once there's a concrete reason to. Catch expected failures and return a typed `{ success, error }` result rather than letting them throw, so a caller can show a specific message without tripping `error.tsx`.

# Testing

- **Vitest** (`npm run test` / `npm run test:watch`) with React Testing Library and jsdom. Config: `vitest.config.mts` (test runner, `@/` alias matching `tsconfig.json`) and `vitest.setup.ts` (registers `@testing-library/jest-dom` matchers).
- **Tests live next to the code they test** — `lib/tebex/mapper.test.ts` beside `mapper.ts`, `components/package/package-price.test.tsx` beside `package-price.tsx`. `test/` is reserved for cross-cutting setup/infrastructure, not feature coverage.
- **Vitest cannot render `async` Server Components** — a Vitest/React ecosystem limitation, not something this config works around (see the [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)). Since every route's `page.tsx`/`layout.tsx` is an async Server Component, unit tests target `components/*` (synchronous and prop-driven by design) or plain functions in `lib/`. Testing the route layer itself would need E2E tooling, which isn't set up in this repo.
- Query by role/text the way a user would rather than by implementation details, and assert on what a component renders or a function returns rather than how it's implemented — implementation should stay free to change without breaking tests.
- Tests don't call external APIs, including the real Tebex Headless API — `lib/tebex` tests exercise `mapper.ts`'s normalization against inline fixture data, not live requests or `TEBEX_PUBLIC_TOKEN`.
- There's no enforced coverage threshold; tests are added alongside the functionality they pin down, not as a retroactive push.

# Repository Conventions

- **Environment variables:** `TEBEX_PUBLIC_TOKEN` (required — every route fetches from Tebex at request/build time and throws if it's unset) and `SITE_URL` (optional, defaults to `http://localhost:3000`; used to build absolute URLs for `robots.ts`, `sitemap.ts`, Open Graph, and the package page's JSON-LD). Both are documented in `.env.example`.
- **Biome** (`biome.json`) is the linter and formatter — `npm run lint` (`biome check`) and `npm run format` (`biome format --write`). There's no separate ESLint/Prettier config.
- **`.gitattributes` pins text files to LF.** Without it, `npm run lint` fails on a fresh Windows checkout because Biome expects LF but Windows checks out CRLF by default.
- Each route delegates its presentational markup to a component (`CategoryGrid`/`CategoryDetail`, `PackageDetail`) rather than inlining JSX in `page.tsx` — the page's job is fetching data, resolving not-found cases, and composing components inside the shared `mx-auto max-w-6xl px-6 py-16` wrapper.
- Every data-fetching route has a sibling `loading.tsx` (the App Router convention that wraps the page in a Suspense boundary), built as a self-contained pulsing skeleton shaped like that route's actual layout rather than a shared spinner.
- **Streaming trade-off:** because `/category/[id]` and `/package/[id]` stream behind `loading.tsx`, Next.js sends response headers (status `200`) before `notFound()` can run, so an invalid ID responds with HTTP `200` and the not-found UI arrives via the stream rather than as a `404` status. The correct content still renders — this is standard Next.js streaming behavior, not a bug to work around by removing the Suspense boundary.
- **Dynamic-rendering trade-off:** `app/layout.tsx` calls `getCurrentBasket()` (see `lib/tebex/session.ts`) to show the header's basket count, and that call reads a cookie via `cookies()` — a request-time API. Since `layout.tsx` wraps every page route, this opts every page (`/`, `/cart`, `/category/[id]`, `/package/[id]`) into dynamic, server-rendered-per-request behavior — `/` was previously statically prerendered (confirmed via `npm run build`'s Route table) and no longer is. The metadata file-convention routes (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`) are unaffected and stay static, since they're independent route handlers that don't render through `RootLayout`/`<Header>`. This is an unavoidable consequence of a basket indicator that needs to be accurate on every page, not something to "fix" by removing the header's basket read.

# Development Principles

This project prioritizes clarity over abstraction: the simplest solution that accurately represents the Tebex domain, over layers, generic reusable infrastructure, or client-side caching that nothing here currently needs. Pages call `lib/tebex` functions directly and pass results through as props — no repositories or data-fetching hooks exist because no requirement (e.g. client-side interactivity needing revalidation) has demanded one yet.

The codebase currently has no UI/component library dependency (no shadcn, Radix, MUI, etc.) — styling is hand-written Tailwind utilities against theme tokens. If a feature needs complex interactive primitives (comboboxes, dialogs with focus trapping, etc.) that would be a deliberate, explicit decision rather than an incremental addition.

Code is organized around Tebex domains (`category/`, `package/`) rather than technical layers (`common/`, `shared/`, `utils/`, `hooks/`). This has stayed flat because nothing yet needs a cross-cutting utility layer — if a genuine cross-domain need shows up (e.g. shared hooks once client interactivity exists), introducing that structure at that point is consistent with how the rest of the codebase grows: add structure when something concrete needs it, not ahead of time.
