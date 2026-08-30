# Tebex Storefront Theme

A customizable storefront theme for [Tebex](https://tebex.io) stores, built on Next.js 16 (App Router) and Tailwind v4. It renders your store's categories and packages from the [Tebex Headless API](https://docs.tebex.io/developers/headless-api/overview) — browse, search, add to basket, apply coupons/gift cards/creator codes, check out, sign in, and gift a package to another player. It's meant to be forked and reskinned per store, not used as a multi-tenant product.

The current release covers browsing (categories, packages, package detail, search), a basket (add/remove items, quantity, package variables, gifting, `/cart`), coupons/gift cards/creator codes, checkout via Tebex.js, authentication (username-based or external-provider redirect, depending on how your store is configured), and an account page. Purchase history isn't included — the public-token Headless API this app uses doesn't expose it; it requires Tebex's separate Plugin API and a private secret key, which this app deliberately doesn't hold. Multi-currency/locale switching also isn't included — the Headless API has no per-request mechanism for either.

## Getting started

Install dependencies and copy the environment template:

```bash
npm install
cp .env.example .env.local
```

Set `TEBEX_PUBLIC_TOKEN` in `.env.local` to your store's public token, found at [creator.tebex.io/developers/api-keys](https://creator.tebex.io/developers/api-keys). This is the same public, storefront-scoped token Tebex's own Headless API is built around — safe to use server-side, and distinct from the private secret key used by Tebex's separate Plugin API (which this app doesn't use or hold). It covers everything this storefront does: reading catalog data, and creating/mutating a visitor's own basket (add/remove items, coupons, checkout).

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

Tests run on [Vitest](https://vitest.dev), with [React Testing Library](https://testing-library.com/react) for component behavior and [jsdom](https://github.com/jsdom/jsdom) as the DOM environment. Configuration lives in `vitest.config.mts` (test runner + the `@/` path alias, matching `tsconfig.json`) and `vitest.setup.ts` (registers `@testing-library/jest-dom`'s matchers, the global `afterEach(cleanup)`, and a `window.matchMedia` polyfill jsdom doesn't provide on its own).

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

### Going further for your game

`themes/default.css` ships one deliberately generic palette rather than guessing at your specific game's branding. Once you know what you're running, its token system is the intended place to layer that identity in — a bolder or different accent color, a tighter or looser type scale, imagery and iconography that match your game, all without touching a component.

That's the same call already made for `components/player-avatar.tsx`: it renders a Minecraft head-render avatar keyed off `Webstore.platform_type`, and Steam/FiveM equivalents deliberately aren't built in — not an oversight, but a platform-specific decision left for whoever forks the template for that platform (see `AGENTS.md`'s Exception Process). Theming follows the same principle: platform- and game-specific visual decisions belong in your fork's copy of `themes/default.css`, not in the shared default this template ships with.

## How Tebex API types are generated

`lib/tebex/generated/schema.ts` is generated from Tebex's published [Headless API OpenAPI spec](https://github.com/tebexio/TebexHeadless-OpenAPI) via [`openapi-typescript`](https://openapi-ts.dev/), and consumed through [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) in `lib/tebex/client.ts`. It's fetched from Tebex's GitHub repo at generation time — the spec YAML itself isn't vendored into this repo.

Run `npm run generate:tebex-types` after a Tebex API change. Never hand-edit `lib/tebex/generated/schema.ts` — it's overwritten on every run.

The rest of the app never touches the generated types or `openapi-fetch` directly: `lib/tebex/index.ts` is the only supported entry point for Tebex API calls — catalog reads (`getWebstore`, `getCategories`, `getCategory`, `getPackage`), basket read/write functions, coupon/gift-card/creator-code apply/remove, and external-provider login links — returning the app-facing domain types from `lib/tebex/types.ts`. Basket and auth session state (the cookies holding a visitor's basket identity and, where relevant, their username) are managed separately in `lib/tebex/session.ts`. See [`AGENTS.md`](AGENTS.md) for the full architecture.

## Troubleshooting

**"Invalid product provided" when adding a package to the basket, even though the package looks completely normal in the dashboard and loads fine on its own page.**

Tebex's basket-add endpoint appears to reject packages priced unusually high (likely a payment-processor transaction limit, not something this storefront controls or can detect ahead of time) — confirmed against a live store, where an oddly-priced test package failed to add with exactly this generic error while a normally-priced one in the same category added fine. That validation only runs at add-to-basket time, not on a plain read, which is why the package still looks fine everywhere else. If you hit this, check the package's price in the Tebex dashboard for a typo (e.g. a missing decimal point) before assuming it's a bug in the storefront — Tebex's own error message doesn't mention price at all.

## Deploying

`npm run build` produces two things from one build: the normal `.next` production output, and — because `next.config.ts` sets `output: "standalone"` — a self-contained `.next/standalone` bundle. Neither deployment path below is more "correct" than the other; standalone exists for Docker specifically, it doesn't replace or require changing the normal one.

### Node.js

Any Next.js host works exactly as usual. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) — the [Vercel Platform](https://vercel.com/new) is the path of least resistance.

```bash
npm run build
npm run start
```

`next start` reads the normal `.next` output, not `.next/standalone` — it doesn't need it. On this Next.js version it prints a `"next start" does not work with "output: standalone" configuration` warning because `.next/standalone` also happens to exist alongside it; that's expected here and safe to ignore — the app serves normally either way (verified). Whichever host you use, set `TEBEX_PUBLIC_TOKEN` as an environment variable there too.

### Docker

`Dockerfile` is a multi-stage build that uses `.next/standalone` instead — a self-contained server bundle with only the runtime dependencies Next.js actually traced, not the full `node_modules` the build stage used to compile it. It runs as the non-root `node` user.

`app/sitemap.ts` and `app/opengraph-image.tsx` are static routes generated at build time and fetch live Tebex data — the **build** needs `TEBEX_PUBLIC_TOKEN`, not just the running container, the same way `npm run build` does locally. It's passed as a [BuildKit secret](https://docs.docker.com/build/building/secrets/) so it never lands in an image layer; `SITE_URL` gets baked into the generated `sitemap.xml`/`robots.txt` at this same step, so pass the real deployed URL here too, not just at runtime:

```bash
docker build --secret id=tebex_public_token,env=TEBEX_PUBLIC_TOKEN --build-arg SITE_URL=https://store.example.com -t storefront .
```

Run it, passing the same variables `.env.example` documents:

```bash
docker run -p 3000:3000 --env-file .env.local storefront
```

Or via Compose, which reads the same `.env.local` and sources the build secret from your shell's `TEBEX_PUBLIC_TOKEN`:

```bash
TEBEX_PUBLIC_TOKEN=... docker compose up --build
```

There's no database or cache to orchestrate — `compose.yaml` exists purely as a convenience wrapper around the one stateless container, not for multi-service orchestration. Docker is one deployment option among several here, not a requirement.
