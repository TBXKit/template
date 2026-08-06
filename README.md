# Tebex Storefront Theme

A customizable storefront theme for [Tebex](https://tebex.io) stores, built on Next.js 16 (App Router) and Tailwind v4. It renders your store's categories and packages from the [Tebex Headless API](https://docs.tebex.io/developers/headless-api/overview) — browse categories, browse packages, view package details. It's meant to be forked and reskinned per store, not used as a multi-tenant product.

The current release is browse-only (categories, packages, package detail). Basket, checkout, authentication, gifting, coupons/gift cards/creator codes, and account/purchase history are planned.

## Getting started

Install dependencies and copy the environment template:

```bash
npm install
cp .env.example .env.local
```

Set `TEBEX_PUBLIC_TOKEN` in `.env.local` to your store's public token, found at [creator.tebex.io/developers/api-keys](https://creator.tebex.io/developers/api-keys). This token is safe to use server-side — it only grants read access to storefront data (webstore info, categories, packages).

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Every route fetches live data from your Tebex account, so `TEBEX_PUBLIC_TOKEN` must be set for the app to render at all — there's no mock/offline mode.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build |
| `npm run lint` | Biome check (lint + format check) |
| `npm run format` | Biome format, writing fixes |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run the test suite in watch mode |
| `npm run generate:tebex-types` | Regenerate `lib/tebex/generated/schema.ts` from Tebex's OpenAPI spec |

## Testing

Tests run on [Vitest](https://vitest.dev), with [React Testing Library](https://testing-library.com/react) for component behavior and [jsdom](https://github.com/jsdom/jsdom) as the DOM environment. Configuration lives in `vitest.config.mts` (test runner + the `@/` path alias, matching `tsconfig.json`) and `vitest.setup.ts` (registers `@testing-library/jest-dom`'s matchers).

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

`test/` holds infrastructure-only tests (currently just a smoke test proving the setup works) — it is not where feature coverage belongs. As real coverage is added, tests should live next to the code they test: `lib/tebex/mapper.test.ts` beside `mapper.ts`, `components/package/package-price.test.tsx` beside `package-price.tsx`, and so on. See [`AGENTS.md`](AGENTS.md) for testing conventions.

## Theming

Visual appearance is driven entirely by CSS variables in [`themes/default.css`](themes/default.css) — colors, card styling, border radius, and section spacing. `app/globals.css` maps those variables into Tailwind v4 utilities (`bg-primary`, `text-foreground`, `bg-card`, `border-border`, `rounded-lg`, `py-section`, ...), and components use those utilities instead of hardcoded colors.

To reskin the store:

1. Copy `themes/default.css` (e.g. `themes/ocean.css`).
2. Edit the variable values — light mode values in `:root`, dark mode values in the `@media (prefers-color-scheme: dark)` block.
3. Point the `@import` at the top of `app/globals.css` at your copy.

No component changes are needed to change the look of the store.

Store name, description, logo, and favicon are not theme tokens — they come from your Tebex account settings via the Headless API (`getWebstore()`) and are rendered wherever the storefront needs them (header, page titles, Open Graph tags). Change those at [creator.tebex.io](https://creator.tebex.io), not in `themes/*.css`.

## How Tebex API types are generated

`lib/tebex/generated/schema.ts` is generated from Tebex's published [Headless API OpenAPI spec](https://github.com/tebexio/TebexHeadless-OpenAPI) via [`openapi-typescript`](https://openapi-ts.dev/), and consumed through [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) in `lib/tebex/client.ts`. It's fetched from Tebex's GitHub repo at generation time — the spec YAML itself isn't vendored into this repo.

Run `npm run generate:tebex-types` after a Tebex API change. Never hand-edit `lib/tebex/generated/schema.ts` — it's overwritten on every run.

The rest of the app never touches the generated types or `openapi-fetch` directly: `lib/tebex/index.ts` is the only supported entry point (`getWebstore`, `getCategories`, `getCategory`, `getPackage`), returning the app-facing domain types from `lib/tebex/types.ts`. See [`AGENTS.md`](AGENTS.md) for the full architecture.

## Deploying

Any Next.js host works. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) — the [Vercel Platform](https://vercel.com/new) is the path of least resistance. Whichever host you use, set `TEBEX_PUBLIC_TOKEN` as an environment variable there too.
