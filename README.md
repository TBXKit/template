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

Keep your real token in `.env.local` (git-ignored via `.env*`). Don't put it in a committed `.env`, and don't paste it into a shared checkout — while it's a *public*, storefront-scoped token, it still identifies your store's account.

## Make this yours

This template ships a deliberately generic store. To turn a fresh fork into your storefront:

1. **Set `TEBEX_PUBLIC_TOKEN`** in `.env.local` (above) — nothing renders without it.
2. **Set `SITE_URL`** to your deployed URL (no trailing slash). It's baked into `sitemap.xml`, `robots.txt`, and canonical/Open Graph metadata. Defaults to `http://localhost:3000`.
3. **Set `DISCORD_URL`** (optional) — shown in the footer when present.
4. **Reskin the theme**: copy `themes/default.css`, edit the CSS variables, and repoint the `@import` in `app/globals.css` (see [Theming](#theming)). No component changes needed.
5. **Replace `app/favicon.ico`** with your own.
6. **Rewrite the homepage placeholder copy**: `components/value-proposition.tsx` and `components/closing-cta.tsx` ship bracketed `[edit me]` text on purpose. The hero, category grid, and everything else is driven by your Tebex data — these two blocks are the only hand-written marketing copy.
7. **Review the footer**: `components/footer.tsx` carries the Tebex merchant-of-record disclosure and legal links — confirm they're right for your store.

Store name, description, logo, and package/category content all come from your Tebex dashboard via the Headless API — change those at [creator.tebex.io](https://creator.tebex.io), not in code.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build |
| `npm run lint` | Biome check (lint + format check) |
| `npm run format` | Biome format, writing fixes |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (no Tebex token needed) |
| `npm run test` | Run the unit test suite once |
| `npm run test:watch` | Run the unit test suite in watch mode |
| `npm run test:e2e` | Run the Playwright end-to-end suite (see Testing) |
| `npm run generate:tebex-types` | Regenerate `lib/tebex/generated/schema.ts` from Tebex's OpenAPI spec |

## Testing

Tests run on [Vitest](https://vitest.dev), with [React Testing Library](https://testing-library.com/react) for component behavior and [jsdom](https://github.com/jsdom/jsdom) as the DOM environment. Configuration lives in `vitest.config.mts` (test runner + the `@/` path alias, matching `tsconfig.json`) and `vitest.setup.ts` (registers `@testing-library/jest-dom`'s matchers, the global `afterEach(cleanup)`, and a `window.matchMedia` polyfill jsdom doesn't provide on its own).

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

Unit tests live next to the code they test: `lib/tebex/mapper.test.ts` beside `mapper.ts`, `components/package/package-price.test.tsx` beside `package-price.tsx`, and so on. `test/` itself is reserved for cross-cutting infrastructure (the setup smoke test, and the end-to-end suite below). See [`AGENTS.md`](AGENTS.md) for testing conventions.

### End-to-end

`npm run test:e2e` runs [Playwright](https://playwright.dev) against a production build of the app, with every Tebex call pointed at a local fixture server (`test/e2e/fixture-server.mjs`) via `TEBEX_API_BASE`. It covers the async Server Component route layer that Vitest can't render, and is where ARIA roles / live regions / focus behaviour get verified in a real browser (see [`AGENTS.md`](AGENTS.md) → Testing Requirements). No Tebex token or network access is needed — the fixture replaces the live API entirely.

```bash
npx playwright install chromium   # one-time, downloads the browser
npm run test:e2e
```

It is not wired into CI yet; a commented-out job stub sits in `.github/workflows/ci.yml`.

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

`npm run build` produces the normal `.next` production output that `next start` and every managed host use. Setting `BUILD_STANDALONE=1` additionally emits a self-contained `.next/standalone` bundle — that's for the Docker image only (the `Dockerfile` sets it), and `next.config.ts` explains why it's opt-in rather than always-on (it breaks Vercel's build).

Required env vars, wherever you deploy: `TEBEX_PUBLIC_TOKEN` (needed at **build** time too — see Docker below), and `SITE_URL` for correct absolute URLs in `sitemap.xml` / `robots.txt` / Open Graph tags. On Vercel `SITE_URL` can be omitted — `lib/site.ts` falls back to `VERCEL_PROJECT_PRODUCTION_URL`.

**Logging.** In production the app logs only recoverable failures (`warn`) and errors — normal traffic produces no log lines, so retained volume tracks problems, not visits. Set `LOG_LEVEL=info` if you want a completed-purchase line as an audit trail, or `LOG_LEVEL=debug` to trace every visitor action while diagnosing something. See [`AGENTS.md`](AGENTS.md) → Logging.

### Node.js

Node 20.9+ (see `package.json` `engines`; `.nvmrc` pins the dev/CI/Docker version). Any Next.js host works as usual — see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying); the [Vercel Platform](https://vercel.com/new) is the path of least resistance and needs no `next.config.ts` changes.

```bash
npm run build
npm run start
```

### Docker

`Dockerfile` is a multi-stage build that sets `BUILD_STANDALONE=1` and copies the resulting `.next/standalone` — a self-contained server bundle with only the runtime dependencies Next.js actually traced, not the full `node_modules` the build stage used to compile it. It runs as the non-root `node` user.

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
