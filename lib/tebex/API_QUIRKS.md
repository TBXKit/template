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

If you find a new mismatch, add it here as a one-line pointer and document the
full reasoning inline at the point it's handled — the same pattern every entry
above already follows.
