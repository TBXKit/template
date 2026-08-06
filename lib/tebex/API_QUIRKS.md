# Tebex API quirks — reference

Confirmed against a live store, not just Tebex's documentation or the generated
schema. This is an index, not a duplicate explanation — the full reasoning for
each quirk lives as a comment at the file/line noted, since that's the place
it actually matters when you're changing that code.

- **Not-found status codes aren't consistent per endpoint.** Category: `422`.
  Package: `400`. Basket: `404` (the only one that matches convention). See
  the `notFoundStatuses` argument at each call site in `lib/tebex/index.ts`.
- **`getCategory`/`getPackage` cast one shape mismatch.** The single-item
  endpoints reuse `CategoryResponse`/`PackageResponse` (typed `data: T[]`)
  even though the live API returns one object, not an array. See the comment
  above each cast in `lib/tebex/index.ts`.
- **Known schema/runtime mismatches handled in `mapper.ts`:** `Package.type`
  is a plain `string` in the generated schema (not a union), even though
  `"subscription" | "single"` are the only real values; `Category.display_type`
  defaults anything other than `"list"` to `"grid"`; `Webstore.supports_usernames`/
  `supports_gifting` are returned by the live API but aren't declared in the
  generated schema at all; `Category.packages` is typed nullable and
  normalizes to `[]`; `Package.media` items with no `url` are dropped. See
  `mapper.ts` and `mapper.test.ts` for the exact handling of each.
- **`Basket.id` is a JSON number at runtime**, despite the generated schema
  typing it as a string. See the doc comment on `Basket.id` in
  `lib/tebex/types.ts`.
- **`addPackageToBasket`/`removePackageFromBasket` return the `Basket` object
  directly**, while `getBasket`/`createBasket` wrap it in `{ data }` — read
  the response differently per call, it's not a bug. See `lib/tebex/index.ts`.
- **The basket-packages endpoints aren't account-scoped**, unlike every other
  call in `index.ts` — they live at `/baskets/{ident}/packages...` on the bare
  API root, contradicting both the generated schema and Tebex's own published
  docs. This is why they go through `client.ts`'s `basketPackageRequest`
  instead of `tebexClient()`'s typed `GET`/`POST`. Full explanation in the doc
  comment above `basketPackageRequest` in `lib/tebex/client.ts`.
- **`Package.variables`'s shape isn't confirmed against the live API** —
  Tebex's schema types it as an untyped `unknown[]` with no documented shape.
  The type list in `lib/tebex/types.ts` (`PackageVariableType`) is a
  best-corroborated guess from Tebex's dashboard docs, not a confirmed
  contract. See the doc comment above `PackageVariableType`.
- **Coupon/gift card/creator code endpoints, unlike basket-packages, *are*
  correctly account-scoped** as the generated schema declares — confirmed
  against a live store. They go through `tebexClient()`'s typed `POST`
  rather than `basketPackageRequest`'s bare-API-root workaround. All six
  return a bare `{success, message}` envelope (never the updated basket,
  even the three "remove" endpoints the schema types as having no response
  content at all — confirmed they return real JSON regardless), so
  `lib/tebex/index.ts` re-fetches via `getBasket` after each one. See
  `refreshBasketAfter` in `lib/tebex/index.ts`.
- **An invalid coupon/gift card/creator code returns `422` with a specific,
  user-safe `detail` message** (e.g. `"The selected coupon code is
  invalid."`), consistently across all six apply/remove endpoints — unlike
  categories/packages, which each use a different non-standard "not found"
  status. `resolveTebexResponse` (`client.ts`) now extracts this `detail`
  and throws with it instead of a generic message, since Phase 6 needs to
  surface it directly to the visitor. Add a store's own login requirement
  before this: `POST /baskets/{ident}/packages` (not the promo-code
  endpoints) can independently return `422` with `"User must login before
  adding packages to basket"` for username-auth stores — a Phase 7 concern,
  unrelated to the promo-code endpoints above.
- **A username-auth store's basket must be *created* with a `username`** —
  there's no endpoint to attach one afterward. Confirmed live: `POST
  /baskets {"username": "..."}` immediately populates `Basket.username`/
  `username_id`, and only then do package adds stop 422ing with "User must
  login...". Neither the generated schema's `createBasket` requestBody
  (only `complete_url`/`cancel_url`/`custom`/`complete_auto_redirect`) nor
  Tebex's published docs for that endpoint declare `username` as a field —
  see `createBasket`'s doc comment in `lib/tebex/index.ts`. This is why
  `lib/tebex/session.ts` keeps the submitted username in its own cookie
  (`app/login/`) rather than trying to upgrade an already-created anonymous
  basket in place.
- **`getBasketAuthProviders`'s response is wrapped in one extra array layer**
  beyond what the generated schema's `BasketAuthResponse` (`{name, url}[]`)
  declares — confirmed live: a store with no external providers configured
  returns `[[]]`, not `[]`. `mapAuthProviders` unwraps this defensively
  regardless of which shape actually arrives. See `mapper.ts`.
- **Gifting needs no separate resolution step or third-party proxy** —
  confirmed against Tebex's own docs (`guides/baskets/gifting-packages`)
  and a live gift add: include `target_username` or `target_username_id`
  directly in the *same* add-to-basket request as `package_id`/`quantity`;
  Tebex resolves it server-side. Neither field is declared in the generated
  schema's `addBasketPackage` requestBody (same gap as `variable_data`). An
  unresolvable target 400s with a specific `"User not found"`-style
  `detail`. See `addPackageToBasket`'s doc comment in `lib/tebex/index.ts`.
  **Correction (previously stated backwards in this file):** per Tebex's
  docs, `target_username_id` — a platform identifier such as a Minecraft
  UUID or Steam ID — is the field for standard (e.g. Java Edition) stores;
  `target_username` (a plain username) is the one *required instead* for
  Bedrock/Geyser stores, "due to differences in player IDs between
  Minecraft: Java Edition and Minecraft: Bedrock Edition." This project
  currently only sends `target_username` (a plain "Recipient's username"
  text field), which is live-verified working against this project's
  connected store (a real gift to a real Minecraft username succeeded) —
  but that store's exact platform, and therefore whether `target_username`
  is merely tolerated there versus how a genuine Bedrock/Geyser store
  behaves, is unconfirmed. `target_username_id` support now exists at the
  `lib/tebex/index.ts` layer (`addPackageToBasket`'s `targetUsernameId`
  parameter) but is not wired into the UI: this project has no live
  Bedrock/Geyser-vs-standard store pair to verify which `Webstore.platform_type`
  string values, if any, should trigger switching the recipient input from
  a username to a platform ID, and guessing that string match risks
  silently misrouting a real gift. Deliberately left unverified/unwired
  rather than guessed — see `ROADMAP.md`'s Phase 8.1 Known Unknowns entry.
- **`Webstore.supports_gifting` isn't enforced by the API** — confirmed
  live: a store with it `false` (gifting off in **Settings → Checkout**)
  still accepted and correctly resolved a `target_username`. This
  storefront still gates the gift UI on it (and on the per-package
  `disable_gifting`) as a deliberate choice to honor the store owner's
  dashboard setting, not because Tebex requires it. See
  `components/package/package-detail.tsx`.

If you find a new mismatch, add it here as a one-line pointer and document the
full reasoning inline at the point it's handled — the same pattern every entry
above already follows.
