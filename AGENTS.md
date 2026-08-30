<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Purpose

This document is the architectural specification for this repository, for human contributors and AI coding agents alike. It exists so that two different engineers — or an engineer and an agent, on two unrelated days — arrive at the same technical decision from the same starting facts, without first needing to read prior pull requests, prior discussions, or this project's history.

Read **Core Philosophy** once, in full, before making any structural decision. After that, **Decision Procedures** is the fast path for the specific questions it covers; everything past it is reference material, consulted as needed rather than read in order.

Every rule in this document appears exactly once. Where a later section depends on an earlier rule, it references that section by name instead of restating the rule. If the same guidance appears stated two different ways in two places, that is a defect in this document, not two independent rules — fix the document, don't pick whichever version is more convenient.

Where this document names a specific behavior of Next.js as a limitation ("the framework doesn't support X"), it also names the Next.js version that claim was verified against (see **Framework Rules** → *Framework-version-scoped claims*). Treat such a claim as scoped to that version, not as a permanent architectural fact.

# Project Overview

This repository is a customizable **Tebex storefront theme**: a Next.js template that renders a game/community store (categories → packages → package detail) backed by the [Tebex Headless API](https://docs.tebex.io/developers/headless-api/overview). It's meant to be forked or copied by store owners and reskinned — the goal is a clean, minimal starting point, not a feature-complete e-commerce application.

The current release covers browsing (categories, packages, package detail, search), a basket (add/remove items, quantity, package variables, gifting, `/cart`), coupons/gift cards/creator codes, checkout via Tebex.js, authentication (username-based or external-provider redirect, store-dependent), and an account page. Purchase history is out of scope by design — the public-token Headless API this app uses doesn't expose it; it requires the separate Plugin API's private secret-key auth, which this app doesn't hold. Multi-currency/locale switching is out of scope for the same reason of kind: the Headless API has no per-request mechanism for either.

# Core Philosophy

**This is a Tebex storefront, not a component library.** The repository should read as the implementation of a store, not the implementation of a design system. Every export under `components/` should be recognizable to someone who has never seen this codebase as a real Tebex concept, a piece of page structure, or a named piece of cross-cutting plumbing React/Next.js/accessibility/security genuinely requires — never as a generic visual primitive.

**Component categories**, used consistently throughout this document:

- **Domain component** — represents a real Tebex concept a store owner or player would recognize (`PackageCard`, `BasketSummary`, `LoginForm`, `PromoCodes`).
- **Layout component** — provides page structure without representing a Tebex concept itself (`Header`, `Footer`, `Breadcrumbs`).
- **Infrastructure component** — provides a cross-cutting capability required by React, Next.js, accessibility, security, correctness, or testability, not by the storefront's business domain (`ToastProvider`, `TebexHtml`).

A component whose name and behavior are purely about visual styling — a generic `Card`, `Box`, `Stack`, `Button` with a `variant` prop, an `Input` wrapper, a `FormField` — does not belong in this codebase, in any of the three categories above. If a component's own justification for existing is "several things look the same," that is not sufficient justification; see **Architectural Rules** → *Reuse and duplication*.

**A component parameterized by a Tebex domain value that encodes a business rule is a domain component, even if it renders as something small and badge-shaped.** `PackageBadge` takes a `PackageType` and maps it to a label the store defines the meaning of; `PackagePrice` takes pricing fields and applies the store's own definition of "on sale." Neither is a generic `Badge`/`Price` primitive wearing a domain name — the distinguishing test is whether the component encodes a rule the store owner would recognize as theirs, not whether it happens to be small or reusable.

**Similar appearance is not architectural coupling, and similar naming is not either.** `PackageCard` and a category tile can look alike without being the same component — a redesign of one has no obligation to touch the other. The same applies to names: a future `OrderStatusBadge` sharing a naming pattern with `PackageBadge` is not, on that basis alone, a signal to generalize either one into a shared `Badge`. Coupling is established by a shared business rule (see below), never by resemblance in appearance or name.

**Duplication is acceptable when concepts differ, and unacceptable when a business rule is the same in both places.** See **Architectural Rules** → *Reuse and duplication* for the operational test.

**Infrastructure abstractions are justified only when required by React, Next.js, accessibility, security, correctness, or testability.** Testability is listed as its own category deliberately, not folded silently into "correctness": a component made robust to being rendered outside its normal context for a test (e.g. `useToast`'s no-op fallback outside a `ToastProvider`) is also made robust to that happening by mistake in production — the two are the same guarantee, viewed from two different moments.

# Non-Negotiable Constraints

These hold without exception in normal feature work. Overriding any of them follows **Exception Process**, not a judgment call made in the moment a feature seems to need it.

- **Server Components fetch. Client Components are the interactivity exception, pushed to the smallest possible fragment.** → Framework Rules.
- **No Route Handlers, no middleware.** All server-side logic runs through page renders and Server Actions. → Exception Process.
- **No client-side fetching of Tebex data.** A passively-loaded resource URL (an `<img src>`) is not "fetching" in this sense. → Architectural Rules → Separation of concerns.
- **Basket, coupon, gift-card, creator-code, and auth mutations happen only through Server Actions**, never through a client-side API layer. → Tebex Integration.
- **Theme tokens (`bg-primary`, `text-muted-foreground`, ...), never raw Tailwind color-scale classes.** → Styling.
- **Every `<Image>` rendering Tebex-supplied or third-party media passes `unoptimized`.** → Styling.

# Decision Procedures

## Do I need a new component?

```
Need a new component?
│
├─ Does it represent a Tebex concept or a piece of page structure — not a
│  visual shape (card, badge, container)?
│  │
│  ├─ No  → Do not create it. Either it belongs inline inside an existing
│  │        domain component, or the underlying need is for a generic UI
│  │        primitive this project doesn't use — reconsider the need
│  │        itself (Core Philosophy).
│  │
│  └─ Yes ↓
│
├─ Did two or more consumers already exist, before this change, that need
│  this exact behavior?
│  │
│  ├─ Yes → Extract it as a shared, exported component in the domain
│  │        folder both consumers belong to.
│  │
│  └─ No  ↓
│
├─ Does React or Next.js force this into its own file regardless of
│  consumer count — it needs "use client" while its natural parent must
│  stay a Server Component? (See Framework Rules → Client and Server
│  Component boundaries.)
│  │
│  ├─ Yes → Extract it as its own file. One consumer is sufficient; the
│  │        framework, not reuse, is the justification.
│  │
│  └─ No  ↓
│
└─ Keep it as a private, non-exported function inside its one caller's
   file. Revisit only when a second real consumer exists — not because
   the interface could theoretically support one.
```

The consumer-count branch is evaluated against the codebase **before** the change under consideration. Two consumers introduced in the same change that also introduces the shared component do not satisfy it — that is a guess that two things are the same concept, made before a second, independently-written data point could confirm it. Wait for the second consumer to already exist, then extract.

There is no separate "I'm not sure, so I'll extract it to be safe" branch. If both tests above answer no, the answer is no. Under-abstraction costs one future, well-scoped extraction. Over-abstraction costs an unknown number of call sites conforming to a shape that turned out wrong.

## Do I need React Context?

```
Considering Context for a value?
│
├─ Can every component that needs it receive it as a plain prop, passed
│  through 1–2 existing component boundaries that already have a reason
│  to sit there?
│  │
│  └─ Yes → Use a prop. Do not introduce Context.
│
├─ Would a prop instead have to pass through components whose only reason
│  to accept it is to relay it further, or cross a Server/Client boundary
│  that can't carry it as a plain prop at all?
│  │
│  └─ No  → Use a prop, even if it's mildly inconvenient. Inconvenience
│           alone does not justify Context.
│
└─ Yes to relay-only components or an uncarryable boundary → Context is
   justified. Scope the Provider to the smallest subtree that needs it —
   `toast-provider.tsx` wraps `<main>` in the root layout, not the whole
   `<body>`, since `Header`/`Footer` have no need for it.
```

## Do I need `useEffect`?

```
Considering useEffect?
│
├─ Is the effect body computing a value from props/state that could
│  instead be a plain `const` (or `useMemo`, if the computation is
│  expensive) during render?
│  │
│  └─ Yes → Do not use useEffect. Compute the value during render.
│
└─ Is the effect body performing an action in response to a value that
   already changed — calling an imperative browser API, an external
   library's method, or a function like a toast trigger?
   │
   └─ Yes → useEffect is appropriate.
```

See Framework Rules → *`useEffect`* for the worked examples this test is checked against.

## Does this need a Route Handler or middleware?

If a feature seems to need server-side logic that doesn't fit a page render or a Server Action, that is not itself permission to add a Route Handler or middleware — it is the trigger for **Exception Process**. Read that section before writing one.

# Architectural Rules

## Extraction

Covered fully as a decision procedure above. The rule in one sentence: extraction is opt-in, evidence-based (a second real consumer, or a framework constraint), and ties go to keeping code local.

## Reuse and duplication

Before reusing or duplicating a piece of logic, apply this test:

> If the store owner's actual business policy changed — not a visual redesign, a real policy change like "gifting requires an existing account" — would both pieces of code need to change, and change identically?

A **business rule** is something the store owner, not the engineering team, would recognize as a policy: "gifting requires login," "a disabled-quantity package is capped at 1," "a package is on sale when its discount is positive and its total price is below its base price." A value chosen for feel rather than policy — a debounce delay, a toast's auto-dismiss timer, an animation duration — is not a business rule, even when duplicated; treat it as ordinary implementation duplication.

- **If both pieces of code encode the same business rule,** merge them into a single implementation, regardless of how different their calling contexts look. Two places both computing "is this package on sale" from the same discount/price fields are the same business rule wearing two contexts — one feeding a UI badge, one hypothetically feeding a receipt email — not two different concepts that happen to look alike.
- **If only a visual redesign would touch both, or only one would plausibly ever change,** they are coincidence, not a shared rule. Keep them separate even if they currently look identical — `PackageCard` and `CategoryGrid`'s `CategorySection` share a visual style today; a redesign of one has no reason to touch the other.

Tolerance for the two categories is not symmetric. Treat a **second** occurrence of duplicated business logic as already worth resolving — a silently diverging business rule is a bug that looks fine until the numbers stop matching, and is expensive to notice precisely because nothing looks visibly wrong. Visual or structural duplication can wait far longer: it diverging just looks inconsistent, which is cheap to notice and cheap to fix.

## Separation of concerns

Pages and layouts fetch; components render what they're given. Components under `components/` never call `fetch` or import from `lib/tebex`'s functions directly — they import only types from `lib/tebex/types` and render props. This keeps the data-fetching boundary at the page/layout level and components trivially testable.

This app never issues a `fetch()` (or a fetch-like library call) from client code to retrieve **Tebex** data, and never holds Tebex-derived state in the client beyond what a Server Action's own response already carries. A passively-loaded resource URL is not client-side fetching in this sense — `player-avatar.tsx`'s `<Image src="https://mc-heads.net/...">` points a browser-rendered `<img>` at a third-party image URL; it is not an active data-retrieval call and is not restricted by this rule.

A feature that seems to need client-side fetching is first checked against whether a Server Action plus `router.refresh()` achieves the same result — `checkout-panel.tsx`'s `close` handler re-fetches the basket this way, since the visitor may have applied a coupon inside the Tebex.js overlay. If it genuinely can't be expressed that way, raise that tension in the PR description **before** the code is written — not as a comment justifying the choice after it already exists.

## Domain modeling

Domain types (`lib/tebex/types.ts`) are deliberately not a mirror of the generated schema. The generated types describe everything the Headless API can return (tiers, dynamic packages, sidebar modules, creator metadata, ...); `types.ts` describes only what this storefront currently renders — `Coupon`/`GiftCard`, for instance, are each modeled with only the one field (`code`/`card_number`) this app actually displays, not the fuller shape Tebex's schema allows. Add a field when a component needs it, not because Tebex exposes it.

Every domain type has exactly one `map*` function in `lib/tebex/mapper.ts` normalizing the generated schema shape into it. See Tebex Integration → *Data flow* for the full contract those functions guarantee.

# Framework Rules

## Client and Server Component boundaries

Server Components by default. Every route's `page.tsx`/`layout.tsx` is an `async` Server Component that fetches its own data directly (see Architectural Rules → Separation of concerns).

Client Components are the exception, used only where React or a browser-only API genuinely requires them: `app/error.tsx`/`app/global-error.tsx` need `"use client"` because Next.js error boundaries must be Client Components. Every basket/checkout/auth control that needs pending/error state from `useActionState` is a Client Component for the same reason — `AddToBasketButton`, `RemoveFromBasketButton`, `QuickAddButton`, `PromoCodes`, `LoginForm` — plus `CheckoutPanel`, which additionally calls the `@tebexio/tebex.js` SDK and reacts to its events. External-provider login links are plain server-rendered `<a href>` elements with no client code at all, since a full-page redirect needs none.

**When a feature needs client interactivity, extract the smallest self-contained fragment into its own Client Component — never promote the parent.** `AddToBasketButton`, `RemoveFromBasketButton`, and `QuickAddButton` all exist specifically so their Server-Component parents (`PackageDetail`, `BasketSummary`, `PackageCard`) don't have to become Client Components.

"Smallest" means the smallest **self-contained** unit, not the fewest lines. When two interactive pieces in the same area need to coordinate directly — share state, respond to each other — extract them together as one Client Component, rather than as separate siblings that would then need a new prop-passing or Context scheme just to talk to each other.

## `useEffect`

`useEffect` performs an imperative action in response to a value that already changed — calling an external API, an imperative browser API, or a function like a toast trigger. It never computes and stores a value that could instead be a plain `const` (or `useMemo`) during render.

`quick-add-button.tsx`'s toast trigger is legitimate under this test: it calls `showToast()` — an imperative action — inside a `useEffect` that fires once a `useActionState` result has already resolved. The legitimacy comes from the effect performing an action, not merely from reacting to a state change; an effect that instead recomputed and stored a derived value from that same result would not be legitimate, even though it would also be "reacting to a `useActionState` result." (`checkout-panel.tsx`'s Tebex.js event listeners are a related but different case — they're registered inside a plain function invoked from the Checkout button's `onClick`, not a `useEffect`, since there's nothing to react to on mount; checkout only needs to initialize once the visitor actually clicks.)

## React Context

Covered fully as a decision procedure above. `toast-provider.tsx` qualifies: a `QuickAddButton` anywhere in a page's content needs to trigger one fixed-position region regardless of how many sibling cards separate them, there is no shared ancestor closer than the page itself with any other reason to hold that value, and prop-drilling it would pass through `CategoryDetail`/`PackageCard`, neither of which has any other reason to know about toasts.

## Routing and file conventions

Routes live under `app/` using the file-based convention (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`), alongside file-convention metadata routes (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`). These filenames are recognized by Next.js purely by name and location — there's no import or registration connecting, say, a page's `notFound()` call to the sibling `not-found.tsx` that renders it.

Route params and layout props use Next 16's generated helpers (`PageProps<"/category/[id]">`, `LayoutProps<"/">`) instead of hand-written prop types. These aren't imported from anywhere in this repo — Next generates them into `.next/types/` while the dev server or build runs, so they may show as unresolved in an editor until `npm run dev`/`npm run build` has run at least once.

`generateMetadata` is used per-route for `<title>`/`<meta description>`, sourced from the same Tebex data the page itself fetches. `layout.tsx` additionally sets the sitewide title template, Open Graph/Twitter defaults, and `metadataBase` (from `lib/site.ts`'s `SITE_URL`). `robots.ts`, `sitemap.ts`, and `opengraph-image.tsx` build on the same `lib/tebex` calls to produce the rest of the SEO surface.

**Streaming trade-off.** `/category/[id]` and `/package/[id]` stream behind `loading.tsx`, so Next.js sends response headers (status `200`) before `notFound()` can run — an invalid ID responds with HTTP `200` and the not-found UI arrives via the stream rather than as a `404` status. The correct content still renders; this is standard Next.js streaming behavior, not a bug to work around by removing the Suspense boundary.

**Dynamic-rendering trade-off (verified against Next.js 16).** `app/layout.tsx` calls `getCurrentBasket()` to show the header's basket count and auth state, reading a cookie via `cookies()` — a request-time API. Since `layout.tsx` wraps every page route, this opts every page into dynamic, server-rendered-per-request behavior. The metadata file-convention routes are unaffected and stay static, since they don't render through `RootLayout`/`<Header>`. See *Framework-version-scoped claims* below before treating this as permanent.

**Non-catalog routes are `noindex`, not just absent from the sitemap.** `/cart`, `/login`, `/account`, and `/search` each set `robots: { index: false }` in their own `metadata` — category/package pages stay indexable. `app/robots.ts` stays a blanket `allow: "/"` rather than mirroring this with `disallow` rules: combining a robots.txt disallow with a page's own `noindex` is counterproductive per Google's own guidance, since a disallowed page can never be crawled far enough to see the `noindex` tag telling it to drop out of results. Give any new non-catalog route the same `robots: { index: false }` treatment.

## Framework-version-scoped claims

A trade-off justified by "the framework doesn't support this" names the framework version that claim was verified against, and is re-verified as part of any future pull request that changes that framework's version — not on an unowned calendar schedule. The dynamic-rendering trade-off above is scoped to Next.js 16; a pull request upgrading Next.js is not complete until it re-checks whether a version-specific capability (e.g. Partial Prerendering) changes that trade-off's conclusion.

# Tebex Integration

`lib/tebex/index.ts` is the application's interface to the Tebex Headless API — the only file `app/` and Server Actions call into for Tebex data. It exposes `getWebstore`, `getCategories`, `getCategory(id)`, `getPackage(id)` (cached, `next: { revalidate: 300 }`); basket read/write functions `getBasket`, `createBasket(username?)`, `addPackageToBasket` (accepts optional `variableData` for package variables and `targetUsername`/`targetUsernameId` for gifting), `removePackageFromBasket`; six coupon/gift-card/creator-code functions (`applyCoupon`/`removeCoupon`, `applyGiftCard`/`removeGiftCard`, `applyCreatorCode`/`removeCreatorCode`); and `getBasketAuthProviders(ident, returnUrl)` for external-provider login. Every basket/auth-adjacent function is never cached (`cache: "no-store"` — basket data is per-visitor and mutates on nearly every request); catalog functions use the 300s cache. Each returns app-facing domain types rather than raw API responses.

A new catalog-shaped read defaults to the existing 300s cache window; a new visitor-specific read defaults to `no-store`. A different window for either category is a deliberate choice, documented next to the call site the way every other cache option in `index.ts` already is.

**Data flow:** generated schema → `lib/tebex/mapper.ts` → domain types (`lib/tebex/types.ts`) → components. `index.ts` calls the generated client via `client.ts`, then hands the raw response to a `map*` function (`mapWebstore`, `mapCategory`, `mapPackage`, `mapBasket`, `mapAuthProviders`) before returning it. Nothing outside `lib/tebex/` imports `generated/schema.ts` directly — components only ever see `lib/tebex/types.ts` shapes.

**Generated types.** `lib/tebex/generated/schema.ts` is generated from Tebex's published [Headless API OpenAPI spec](https://github.com/tebexio/TebexHeadless-OpenAPI) via `npm run generate:tebex-types`. The spec YAML itself isn't vendored — it's fetched from Tebex's GitHub repo at generation time. Regenerate after a Tebex API change rather than hand-editing the file; it carries its own "do not edit" banner and gets overwritten on every run.

**Why the mapper exists.** The generated schema marks every field optional and doesn't guarantee a present field has the type it claims either. `mapWebstore`/`mapCategory`/`mapPackage`/`mapBasket` treat their input as fully untrusted and validate every field by type, never throwing — a malformed top-level argument returns a fully-defaulted domain object; a malformed entry inside an array is dropped rather than defaulted. See `lib/tebex/mapper.test.ts` for the exact contract, and `lib/tebex/API_QUIRKS.md` for the specific schema/runtime mismatches this currently handles.

**Not-found handling.** Tebex doesn't use a consistent "not found" status code per endpoint. `client.ts`'s `resolveTebexResponse` takes an explicit `notFoundStatuses` allowlist per call site, resolving to `null` so pages can call Next's `notFound()`; any other non-OK response throws. Follow this explicit-allowlist pattern (not a blanket `try/catch`) for new endpoints — see `lib/tebex/API_QUIRKS.md` for which status code each current endpoint actually uses.

**Adding a new endpoint:** add the fetch call to `index.ts` via `tebexClient()` + `resolveTebexResponse`, add a `map*` function to `mapper.ts` if the response needs normalizing, and extend `types.ts` with only the fields the feature actually needs. If a schema/runtime mismatch turns up while doing this, add it to `lib/tebex/API_QUIRKS.md` alongside the existing ones.

**Unused surface.** The OpenAPI spec also covers tiered/dynamic categories and sidebar modules — not implemented here. A few endpoints (`getUserTieredCategories`, `updateTier`, and the separate Plugin API's purchase-history endpoint) require basic-auth private-key credentials this app doesn't have — a deliberate, confirmed boundary, not an oversight (the account page states this explicitly rather than silently omitting purchase history).

**Confirmed but undocumented request fields.** Several real, working request fields aren't declared in Tebex's own generated schema (see `lib/tebex/API_QUIRKS.md` for the full, current list): `createBasket`'s `username` — missing from Tebex's published docs too, not just the schema, confirmed only by testing against a live store (required before any package can be added on a username-auth store — there's no way to attach one to a basket after creation) — and `addPackageToBasket`'s `target_username`/`target_username_id`/`variable_data`, each missing only from the generated schema; Tebex's own published guides do document them. Treat a "field doesn't work" finding for a basket-mutation endpoint as needing live verification, not just a schema/docs check.

## Basket session & Server Actions

A visitor's basket identity lives in an HTTP-only cookie, not a client-side store — see `lib/tebex/session.ts`. It's split into two functions rather than one "get or create" helper because Next.js only allows *setting* a cookie from a Server Action or Route Handler, never during Server Component render:

- `getCurrentBasket()` — read-only. Safe from Server Components, layouts, and Server Actions. Returns `null` rather than creating anything.
- `ensureBasket()` — read-or-create. Only callable from a Server Action. Call this first in any basket mutation to guarantee a valid basket before acting on it. Attaches a known username to a newly-created basket if one is already on file.

The same file also holds the visitor's **auth** identity, in a separate cookie from the basket one — necessarily separate, because a username-auth store's basket has to be *created* with a `username` already attached (there's no endpoint to add one afterward), so the username has to be capturable before any basket exists:

- `getCurrentUsername()` / `setCurrentUsername(username)` — the pre-basket cookie signal, read-only / Server-Action-only respectively.
- `getEffectiveUsername()` — read-only; the one signal to use for "is this visitor logged in," anywhere. Prefers `basket.username` (authoritative once a basket exists, since it's fixed at creation) and falls back to the pre-basket cookie. Don't call `getCurrentBasket()` again where a basket is already in hand for another reason — Next.js's request memoization can't dedupe a `cache: "no-store"` fetch the way it would a cacheable one.
- `clearAuthSession()` — logout. Clears **both** the username and basket cookies, not just the username, because a basket's identity can't change after creation — keeping the same basket after "logging out" would leave it tied to the old identity server-side while the header claims the visitor is signed out.

A short-lived, `HttpOnly`, unsigned cookie (`lib/tebex/pending-action.ts`) separately records an add-to-basket call a visitor was mid-submitting when redirected to sign in, replayed once by the username-login Server Action right after sign-in succeeds. Not signed: every value it carries is exactly what a visitor could already submit directly through the add-to-basket action itself, so a tampered cookie grants no capability beyond what that action already accepts from any caller. Only the username-login path replays it — an external-provider store's return trip has no server-side hook to do the same without a Route Handler, which this app doesn't add (see Exception Process); a visitor signing in that way retries the add manually.

Basket **mutations** are Server Actions — plain `"use server"` functions, not a client-side API layer. Exporting a function from a `"use server"` file turns it into a server-side RPC endpoint: a Client Component can import and call it like a normal async function, but the call crosses to the server and back. Colocate a Server Action with the component that triggers it, in its **own file** when a Client Component will import it — a file can't mix `"use client"` and `"use server"`, and Next requires Server Functions used by a Client Component to live in a dedicated file. When one component triggers several related actions, they share a single colocated actions file rather than one file each (see Naming Conventions).

Logic shared between a component-triggered action and another entry point (e.g. the add-to-basket logic shared between the button's action and the post-login resume) lives in `lib/`, not colocated with either caller — it has crossed from "one route's implementation detail" to "reusable domain logic," per Architectural Rules → Separation of concerns.

After a mutation succeeds, call `revalidatePath("/", "layout")` — broad on purpose, since basket state affects the header's item count on every page, not just the mutation's own route. Catch expected failures and return a typed `{ success, error }` result rather than letting them throw. Most actions use a fixed, generic error string; where the underlying Tebex error is itself specific and safe to show (an invalid coupon code, an unresolvable gift recipient), the action surfaces that message directly rather than replacing it with a generic one.

## Checkout (Tebex.js)

`components/basket/checkout-panel.tsx` renders on `/cart` when the basket has items, and owns the whole checkout lifecycle as local component state (`idle` → overlay open → `payment:complete`/`payment:error`/`close`). It imports `checkout` from the `@tebexio/tebex.js` npm package rather than a CDN `<script>` tag: the npm package ships real types and a plain ESM import instead of a `window.Tebex` global, and has no import-time side effects, so it's safe to import from a Client Component even though Next also renders Client Components on the server for the initial HTML.

On `payment:complete`, it clears the basket session (a spent basket's identity can't be reused) and swaps to an in-place confirmation state rather than navigating to a separate route — Tebex.js is an overlay, not a redirect flow. It also fires a `canvas-confetti` burst, loaded via a dynamic `import()` inside the event handler so the dependency never ships in the initial bundle a visitor loads to reach `/cart`, skipped under `prefers-reduced-motion: reduce`. On `close` without a completed payment, it calls `router.refresh()` to re-fetch the basket, since the visitor may have applied a coupon inside Tebex's own overlay UI.

## Authentication & gifting

A store's login method is determined by `Webstore.supports_usernames` — confirmed to gate every package add, not just tiered categories/gifting: `POST /baskets/{ident}/packages` 422s with "User must login..." until the basket was created with a `username`. `app/login/page.tsx` renders one of two UIs based on that flag: a plain username form (`components/auth/login-form.tsx`, no password — Tebex validates/creates the identity itself) for username-auth stores, or external-provider redirect links for stores that use an OAuth-style provider instead — plain `<a href>` elements, no client code, since a full-page redirect needs none. `app/login/safe-redirect.ts`'s `isSafeRedirectPath` guards the `?next=` return-path query param against open-redirect abuse (a relative, same-origin path with no backslash — browsers resolve `\` as `/` for special schemes, so a bare `//`/`://` check alone isn't sufficient).

Gifting needs no separate username-to-identity resolution step: an extra `target_username` or `target_username_id` field submitted alongside `package_id`/`quantity` on the *same* add-to-basket call, which Tebex resolves server-side. `target_username_id` (a platform ID) is the field for standard stores; `target_username` (a plain username, what this app sends today) is required instead for Bedrock/Geyser stores — see `lib/tebex/API_QUIRKS.md` for why the platform-ID path exists in the data layer but isn't wired to any UI input (no live Bedrock/Geyser store to verify the trigger condition against). The gift option in `AddToBasketButton` is gated on both `Webstore.supports_gifting` and the package's own `disable_gifting` — `supports_gifting` is a client-side courtesy honoring the store owner's dashboard setting, not something the Headless API enforces itself. Gifting always requires the giver to be logged in, gated the same way as a username-auth store's ordinary add-to-basket, regardless of whether the store requires login for non-gift purchases.

A Minecraft-platform store additionally shows a player avatar (`components/player-avatar.tsx`) sourced from a third-party head-render service, keyed off `Webstore.platform_type`. Steam and FiveM avatars aren't implemented: Steam requires a server-held Web API key to resolve a profile image, and FiveM has no equivalent per-player image source — extending either is new infrastructure, not a copy of the Minecraft case, and follows Exception Process the same as any other feature needing a capability this app doesn't currently have.

# Styling

Tailwind v4, CSS-first config — there is no `tailwind.config.ts`. `app/globals.css` does `@import "tailwindcss"` followed by `@import "../themes/default.css"`, then an `@theme inline` block that maps theme CSS variables (`--background`, `--primary`, `--radius`, `--section-spacing`, …) onto Tailwind utility names. A component's `bg-primary` class resolves in two hops: `@theme inline` maps it to `--color-primary` → `var(--primary)`, and `themes/default.css` defines what `--primary` actually is (light and dark).

Theme values live in `themes/*.css` as plain CSS custom properties, light values in `:root` and dark values in an `@media (prefers-color-scheme: dark)` block. Reskinning the store means copying `themes/default.css`, editing the variable values, and repointing the `@import` in `app/globals.css` — no component changes required. Keep `README.md` in sync if the token set changes.

Components use theme utilities (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-primary`, …) rather than raw Tailwind color scales, so that swapping a theme file actually changes the rendered colors.

All `<Image>` usages pass `unoptimized` — package/logo/avatar images come from whatever CDN domain the store's own Tebex account or a third-party avatar service uses, which isn't known ahead of time, so `next.config.ts` can't pre-register `images.remotePatterns` for a domain that varies per deployment.

`@tailwindcss/typography` (the `prose` classes) is registered via `@plugin "@tailwindcss/typography";`, used only by `TebexHtml` to style Tebex-authored rich text. Its color variables are overridden in `app/globals.css`'s `.prose` block to point at this project's own theme tokens instead of the plugin's default `prose-neutral`/`prose-invert` — raw Tailwind color-scale classes, which would violate the theme-token rule above. Don't add `prose-neutral`/`prose-invert`/`dark:` back onto `TebexHtml`.

**Repeated Tailwind utility strings (a primary button's classes, a text input's classes) are expected and acceptable** — this is idiomatic Tailwind, not a violation to fix with a component. A repeated class string graduates to a `@layer components` utility class in `globals.css` — never a React component, never widespread `@apply` — only once changing it requires touching more files than exist in the component's own domain folder: once the change stops being "update the one place this concept lives" and becomes "grep the whole repository." Below that threshold, leave it duplicated.

# Testing Requirements

Vitest (`npm run test` / `npm run test:watch`) with React Testing Library and jsdom. Config: `vitest.config.mts` (test runner, `@/` alias matching `tsconfig.json`) and `vitest.setup.ts` (test-environment setup needed by every test file — `@testing-library/jest-dom` matchers, the global `afterEach(cleanup)`, and a `window.matchMedia` polyfill jsdom doesn't provide on its own).

Tests live next to the code they test — `lib/tebex/mapper.test.ts` beside `mapper.ts`. `test/` is reserved for cross-cutting setup/infrastructure, not feature coverage.

Vitest cannot render `async` Server Components — a Vitest/React ecosystem limitation, not something this config works around. Unit tests target `components/*` (synchronous and prop-driven by design) or plain functions in `lib/`. Testing the route layer itself would need E2E tooling, not set up in this repo.

Query by role/text the way a user would, and assert on what a component renders or a function returns rather than how it's implemented. Tests don't call external APIs, including the real Tebex Headless API — `lib/tebex` tests exercise `mapper.ts`'s normalization against inline fixture data.

**Testing a `useActionState`-backed component:** mock the colocated Server Action module (`vi.mock` + `vi.hoisted`, since the mock has to exist before the component module evaluates), then drive it with `fireEvent.click`/`fireEvent.change`. If a component reacts to a callback invoked outside React's own event system (e.g. manually firing the Tebex.js SDK's `on()` callbacks), wrap that invocation in `act()`.

There's no enforced coverage threshold; tests are added alongside the functionality they pin down, not as a retroactive push. A coverage percentage produces tests written to satisfy a number, not to catch real bugs — this is a deliberate rejection, not an oversight.

**Unit tests passing under jsdom is not sufficient sign-off for a change that sets or relies on an ARIA role (explicit, or implicit via a semantic element), a live-region attribute (`aria-live`, `role="status"`/`"alert"`), or keyboard focus behavior.** jsdom is a known-incomplete DOM implementation — it has already produced one confirmed divergence from real-browser behavior in this codebase (`<output>`'s implicit ARIA role resolves under jsdom but is not reliably exposed in real Chromium's accessibility tree). A change in this category is verified once against a real browser's accessibility tree — Chrome/Firefox DevTools' Accessibility panel, or an automated role/attribute query such as Playwright's `getByRole` — before being considered done. Visual inspection alone does not verify a role or live-region attribute; both have no visible difference between correct and broken.

If a jsdom/real-browser divergence turns up, record it as a comment at the point it's worked around, the same way `lib/tebex/API_QUIRKS.md` indexes confirmed Tebex API mismatches, so the second occurrence is a five-minute fix instead of a re-discovery.

# Accessibility Requirements

Every image gets a deliberate `alt` decision, never a default. `alt=""` only when the same information is already rendered as **always-visible** text nearby — not a tooltip, not hover-only content, not anything requiring an extra interaction to reveal. Real, descriptive text otherwise.

Live regions use `aria-live="polite"` for a confirmation the visitor didn't have to wait to see (an add-to-basket success message) and `"assertive"` only for something that blocks their next action (a failed payment, a rejected form submission).

Every interactive element keeps a visible, **deliberately-styled** focus state — an explicit `focus-visible:` utility, not reliance on the browser's unstyled default, which this project's Tailwind reset can suppress or which can render at low contrast against a given theme.

When a semantic-HTML or ARIA choice is uncertain, verify it against a real browser's accessibility tree rather than the specification alone — see Testing Requirements.

# Naming Conventions

Component names are nouns naming the Tebex concept they render (`PackageCard`, `BasketSummary`) — never the concept prefixed or suffixed with an implementation description (`PackageCardWrapper`, `CardForPackage`). Server Action names are verbs naming the mutation (`addToBasketAction`, `applyCouponAction`).

A technical suffix survives only if it names a role defined by React or the DOM itself, independent of anything this codebase invented: `Provider` names a React Context Provider; `Boundary` names an error boundary, matching `error.tsx`'s actual framework role. A suffix describing what a component does internally, rather than a role React or the DOM already defines — `Wrapper`, `Container`, `View`, `Manager`, `Batcher` — never qualifies, no matter how accurately it describes the implementation. Name the component after the Tebex concept it exposes to its caller; let internal behavior stay an implementation detail invisible in the name.

A single Server Action gets its own file, named `<verb>-action.ts` (`add-to-basket-action.ts`). Several related actions triggered by one component share one file, named `<component>-actions.ts` (`promo-code-actions.ts`, for `promo-codes.tsx`'s six actions).

# Repository Organization

- `app/` — routes and route-convention files only (pages, layout, loading/error/not-found boundaries, metadata routes, global CSS entry), plus route-specific helpers/Server Actions tightly coupled to one route and colocated with it. Reusable domain logic that doesn't depend on how a route renders itself belongs in `lib/` instead.
- `components/` — presentational, prop-driven UI, organized by Tebex domain (below).
- `lib/site.ts` — the single `SITE_URL` constant, used by `robots.ts`, `sitemap.ts`, the root layout's metadata, and the package page's JSON-LD.
- `lib/logger.ts` — the single shared structured logger (see Logging).
- `lib/tebex/` — the Tebex data-access layer: `index.ts`, `client.ts`, `mapper.ts`, `types.ts`, `session.ts`, `pending-action.ts`, `add-to-basket.ts`, `currency.ts`, `search.ts`, `generated/schema.ts`. See Tebex Integration, and `lib/tebex/API_QUIRKS.md` for confirmed schema/runtime mismatches.
- `themes/` — CSS files defining design tokens as custom properties. `default.css` is the shipped theme; alternate themes are sibling files swapped via one `@import` in `app/globals.css`.
- `test/` — cross-cutting test infrastructure only. Feature test coverage lives next to the code it tests, not here.

## Component organization

Components are grouped by Tebex domain where a domain has more than one related component — `components/category/`, `components/package/`, `components/basket/`, `components/auth/`. Components without siblings stay as flat files at the top of `components/` (`header.tsx`, `footer.tsx`, `hero.tsx`, `breadcrumbs.tsx`, `store-disabled-banner.tsx`, `search-form.tsx`, `tebex-html.tsx`, `toast-provider.tsx`, `player-avatar.tsx`, `value-proposition.tsx`, `category-showcase.tsx`, `closing-cta.tsx`).

Every component takes its data as props — none of them fetch, none of them reach into global state (see Architectural Rules → Separation of concerns).

A domain folder subdivides further only when the domain itself has split into sub-concepts that genuinely don't need each other — never purely because its file count is high. File count is a tooling-convention signal, not a domain signal, and organizing around it would contradict organizing by domain in the first place.

A component that combines two domains' data (e.g., a package card showing whether the package is already in the basket) lives in the folder of the domain whose page renders it — the consumer's route owns the placement decision — even though it also reads the other domain's data as a prop. It does not get a new cross-domain folder.

`TebexHtml`/`ToastProvider`/`PlayerAvatar`-style infrastructure and layout components stay flat at the top of `components/` rather than nested in a domain folder, even when domain-adjacent — `TebexHtml` isn't specific to package or category content, and `PlayerAvatar` is specific to the signed-in player's identity, matching `components/auth/`'s domain rather than any single page that happens to render it.

# Logging

`lib/logger.ts` exports a single shared `pino` logger (`logger`) — never `console.log`/`console.error`/`console.warn`/`console.debug` anywhere in this codebase, including client-side error boundaries. No `pino-pretty`/`transport` — plain synchronous JSON to stdout, since pino's `transport` option spawns a worker thread that doesn't survive Next.js's bundling. Level defaults to `debug` in development and **`warn` in production**, overridable via `LOG_LEVEL`. The production default is deliberately below `info`: normal operation logs nothing, so retained volume (which costs money) tracks problems, not traffic.

**Levels, used consistently:**

- `error` — a failure that isn't the visitor's fault or isn't self-explanatory (a failed basket add/remove that carries no safe specific message; a client-side render error forwarded from `error.tsx`).
- `warn` — an expected, recoverable, visitor-caused failure worth seeing in aggregate: an unresolvable gift target, an invalid coupon/gift-card/creator-code (anywhere Tebex's own `detail` message is safe to surface directly), or a request the UI can't produce (an out-of-range add-to-basket quantity — a sign of a crafted call). One line per fat-fingered input, not per request.
- `info` — **a completed purchase, and nothing else.** It's the one routine event with lasting operational value. It stays off in production by default (level is `warn`); an operator who wants a purchase trail sets `LOG_LEVEL=info`, accepting that Tebex's dashboard, not this log, is the authoritative record.
- `debug` — every other routine visitor action (basket created, package added/removed, promo code applied, login, logout, login-redirect) and internal diagnostics (a malformed pending-action cookie, a basket cookie pointing at an expired basket). Dev-only by default; none of it is prod signal.

**Failures are logged once, at the layer with the most context — the Server Action that catches the thrown error and knows the business operation.** `client.ts`/`resolveTebexResponse` does **not** log: a per-request line there fires on every catalog read and basket mutation — pure volume, no operator signal — and it lacks the business context (`client.ts` sees an HTTP status; the Server Action knows it was "apply coupon" for a specific basket). Don't reintroduce request-level logging in the Tebex client.

**Never log a basket `ident` in full** — use `redactBasketIdent` from `lib/logger.ts`. A basket ident is a bearer credential, the same trust level as a session cookie, not just an identifier.

**A caught `Error` logs as `{ err: error }`**, not spread or stringified — `lib/logger.ts` registers `pino.stdSerializers.err` for a proper `{type, message, stack}` shape.

**Client Components can't use `pino` directly** — `app/error.tsx`/`global-error.tsx` forward to the server-side logger via a Server Action instead of `console.error`. Only `message`/`digest`/`name` are forwarded, never `error.stack`.

**Never log:** passwords (n/a — this app has none), auth tokens (redacted from logged URLs regardless of the public token's own "safe to expose" docs), cookies/session identifiers, emails, payment details. A visitor's username is logged as-is — already shown as normal UI in this app, not a secret.

**Pure helpers in `lib/tebex/mapper.ts` deliberately have no logging.** They're called on every catalog render, are unit-tested as pure and deterministic, and their fallback-default behavior is the designed, constantly-exercised path for Tebex's everything-optional schema — not a rare exception. If a genuinely rare/severe malformation needs visibility, a Server Action's existing `catch` is the right seam.

No Route Handlers, middleware, or webhook endpoints exist in this app (see Non-Negotiable Constraints) — don't add logging infrastructure for them speculatively.

# Environment & Configuration

- `TEBEX_PUBLIC_TOKEN` (required — every route fetches from Tebex at request/build time and throws if it's unset), `SITE_URL` (optional, defaults to `http://localhost:3000`), `DISCORD_URL` (optional, shown in the footer only when set). Documented in `.env.example`.
- Biome (`biome.json`) is the linter and formatter — `npm run lint` (`biome check`) and `npm run format` (`biome format --write`). No separate ESLint/Prettier config.
- `.gitattributes` pins text files to LF. Without it, `npm run lint` fails on a fresh Windows checkout because Biome expects LF but Windows checks out CRLF by default.
- Each route delegates its presentational markup to a component rather than inlining JSX in `page.tsx` — the page's job is fetching data, resolving not-found cases, and composing components inside the shared `mx-auto max-w-6xl px-6 py-16` wrapper. A non-trivial data transformation that isn't fetching or composing (e.g. JSON-LD construction) lives in a small nearby helper file, not inline in `page.tsx`.
- Every data-fetching route has a sibling `loading.tsx`, built as a self-contained pulsing skeleton shaped like that route's actual layout, not a shared spinner.

# Exception Process

Every prohibition in this document exists for a stated reason, and every one has a path to override it when a real feature genuinely needs to. An override is a decision made **before** the code that would cross the line is written. A comment inside the finished code explaining why the constraint was crossed documents a decision already made — it does not substitute for making that decision first, and does not by itself satisfy this process.

**Overrides are agreed on with a human maintainer, not decided unilaterally by whoever is implementing the feature — human or AI agent.** An agent that determines a constraint needs to be crossed states the case below and gets it confirmed before writing the crossing code, the same as a human contributor would.

## Overriding "no Route Handlers, no middleware"

This constraint exists because a Route Handler or middleware reintroduces the kind of server-side layer this project's Server-Components-and-Actions model exists to avoid, and creates a second, differently-shaped place for validation, logging, and error-handling conventions to diverge from the rest of the app.

Before introducing a Route Handler or middleware:

1. State, in the pull request description, what the feature needs that a page render or a Server Action cannot provide (e.g., "the visitor is redirected here by an external service that can only issue a GET/POST directly, not through a same-origin form submission").
2. Confirm no existing pattern already covers it — check Framework Rules and Tebex Integration for a similar need already solved another way.
3. Name the alternative considered and rejected, and why it doesn't work — not just that a Route Handler is more convenient.
4. Get this agreed on **before** writing the Route Handler. A thorough comment inside the finished Route Handler explaining the reasoning does not substitute for this step.

## Overriding any other constraint in this document

The same shape applies: state what the feature needs that the constraint blocks, confirm no existing pattern already covers it, name the rejected alternative, and get it agreed on before writing the code that crosses the line.
