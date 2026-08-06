import {
  basketPackageRequest,
  resolveTebexResponse,
  tebexClient,
} from "./client";
import type { components } from "./generated/schema";
import {
  mapAuthProviders,
  mapBasket,
  mapCategory,
  mapPackage,
  mapWebstore,
} from "./mapper";
import type {
  AuthProvider,
  Basket,
  Category,
  Package,
  Webstore,
} from "./types";

const CACHE_OPTIONS = { next: { revalidate: 300 } } as const;

// Basket data is per-visitor and mutates on nearly every request, unlike the
// catalog data above — it must never be served from the shared 300s cache.
const NO_STORE_OPTIONS = { cache: "no-store" } as const;

export async function getWebstore(): Promise<Webstore> {
  const { GET } = tebexClient();
  const result = await resolveTebexResponse(GET("/", CACHE_OPTIONS));

  if (!result?.data) {
    throw new Error("Webstore data is unavailable");
  }

  return mapWebstore(result.data);
}

export async function getCategories(): Promise<Category[]> {
  const { GET } = tebexClient();
  const result = await resolveTebexResponse(
    GET("/categories?includePackages=1", CACHE_OPTIONS),
  );

  return (result?.data ?? []).map(mapCategory);
}

// Tebex returns 422 (not 404) for a category ID that doesn't exist.
export async function getCategory(id: number): Promise<Category | null> {
  const { GET } = tebexClient();
  const result = await resolveTebexResponse(
    GET("/categories/{categoryId}?includePackages=1", {
      ...CACHE_OPTIONS,
      params: { path: { categoryId: String(id) } },
    }),
    [404, 422],
  );

  if (!result?.data) return null;

  // The OpenAPI schema reuses CategoryResponse (`data: Category[]`) for this
  // endpoint, but the live API returns a single Category object in `data`.
  // This cast bridges that one known shape mismatch; mapCategory then
  // normalizes every field of the resulting object into the domain type.
  const raw = result.data as unknown as components["schemas"]["Category"];
  return mapCategory(raw);
}

// Tebex returns 400 (not 404) for a package ID that doesn't exist.
export async function getPackage(id: number): Promise<Package | null> {
  const { GET } = tebexClient();
  const result = await resolveTebexResponse(
    GET("/packages/{packageId}", {
      ...CACHE_OPTIONS,
      params: { path: { packageId: String(id) } },
    }),
    [400, 404],
  );

  if (!result?.data) return null;

  // Likewise, PackageResponse types `data` as Package[], but this endpoint
  // returns a single Package object at runtime.
  const raw = result.data as unknown as components["schemas"]["Package"];
  return mapPackage(raw);
}

// A missing/expired basket ident's actual status is confirmed as 404 against
// a live store (not just assumed) — unlike getCategory/getPackage's 422/400,
// this one does follow the conventional not-found status.
export async function getBasket(ident: string): Promise<Basket | null> {
  const { GET } = tebexClient();
  const result = await resolveTebexResponse(
    GET("/baskets/{basketIdent}", {
      ...NO_STORE_OPTIONS,
      params: { path: { basketIdent: ident } },
    }),
    [404],
  );

  if (!result?.data) return null;
  return mapBasket(result.data);
}

export async function createBasket(username?: string): Promise<Basket> {
  const { POST } = tebexClient();
  // `username` isn't declared in the generated schema's createBasket
  // requestBody (only `complete_url`/`cancel_url`/`custom`/
  // `complete_auto_redirect` are) — confirmed against a live store as a
  // real, undocumented field: passing it associates the created basket with
  // that player identity immediately. Required before any package can be
  // added on username-auth stores (`Webstore.supports_usernames`) — there's
  // no separate endpoint to attach a username to a basket after creation.
  const body = username ? { username } : undefined;
  const result = await resolveTebexResponse(
    POST("/baskets", { ...NO_STORE_OPTIONS, body }),
  );

  if (!result?.data) {
    throw new Error("Basket creation failed: no basket returned");
  }
  return mapBasket(result.data);
}

// For stores that authorize via an external provider redirect rather than a
// plain username (`!Webstore.supports_usernames`) — see `mapAuthProviders`
// for the one confirmed schema/runtime mismatch this endpoint has (its
// response is wrapped in one extra array layer beyond what's documented).
export async function getBasketAuthProviders(
  ident: string,
  returnUrl: string,
): Promise<AuthProvider[]> {
  const { GET } = tebexClient();
  const result = await resolveTebexResponse(
    GET("/baskets/{basketIdent}/auth?returnUrl={returnUrl}", {
      ...NO_STORE_OPTIONS,
      params: { path: { basketIdent: ident, returnUrl } },
    }),
  );

  return mapAuthProviders(result);
}

// See the doc comment on `basketPackageRequest` in client.ts: these two
// endpoints live at `/baskets/{basketIdent}/packages...` relative to the bare
// API root, not the account-scoped base every other call in this file uses —
// confirmed against a live store, not assumed from the generated schema.
//
// Unlike getBasket/createBasket (which wrap the basket in `{ data }` via
// BasketResponse), these two endpoints return the Basket object directly.
export async function addPackageToBasket(
  ident: string,
  packageId: number,
  quantity: number,
  // Confirmed against Tebex's own docs (unlike the variable metadata shape —
  // see mapPackageVariables): submitted as `variable_data`, an object keyed
  // by each variable's `identifier`.
  variableData?: Record<string, string>,
  // Confirmed against Tebex's own docs (guides/baskets/gifting-packages):
  // submitted as `target_username` alongside `package_id`/`quantity` on this
  // same request — there is no separate username-to-identity resolution
  // endpoint or third-party proxy involved, despite what the reference
  // client's `ident.tebex.io` usage might suggest. Tebex resolves it
  // server-side and throws a 422 with a specific "User not found"-style
  // detail if it can't (surfaced via resolveTebexResponse's error handling).
  targetUsername?: string,
): Promise<Basket> {
  const result = await resolveTebexResponse(
    basketPackageRequest<components["schemas"]["Basket"]>(
      `/baskets/${encodeURIComponent(ident)}/packages`,
      {
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({
          package_id: String(packageId),
          quantity,
          ...(variableData && Object.keys(variableData).length > 0
            ? { variable_data: variableData }
            : {}),
          ...(targetUsername ? { target_username: targetUsername } : {}),
        }),
      },
    ),
  );

  if (!result) {
    throw new Error("Adding package to basket failed: no basket returned");
  }
  return mapBasket(result);
}

export async function removePackageFromBasket(
  ident: string,
  packageId: number,
): Promise<Basket> {
  const result = await resolveTebexResponse(
    basketPackageRequest<components["schemas"]["Basket"]>(
      `/baskets/${encodeURIComponent(ident)}/packages/remove`,
      {
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({ package_id: String(packageId) }),
      },
    ),
  );

  if (!result) {
    throw new Error("Removing package from basket failed: no basket returned");
  }
  return mapBasket(result);
}

// Unlike the basket-packages endpoints above, coupons/gift cards/creator
// codes ARE correctly account-scoped as the generated schema declares —
// confirmed against a live store — so these go through `tebexClient()`'s
// typed POST like every other non-basket-package call in this file.
//
// None of the six apply/remove responses below include the updated basket
// (they're a bare `{success, message}` envelope, confirmed against a live
// store even for the three "remove" endpoints the generated schema types as
// having no response content at all) — so each one re-fetches the basket via
// `getBasket` afterwards, matching what `addPackageToBasket`/
// `removePackageFromBasket` return directly.
async function refreshBasketAfter(
  ident: string,
  action: string,
): Promise<Basket> {
  const basket = await getBasket(ident);
  if (!basket) {
    throw new Error(`Basket not found after ${action}`);
  }
  return basket;
}

export async function applyCoupon(
  ident: string,
  code: string,
): Promise<Basket> {
  const { POST } = tebexClient();
  await resolveTebexResponse(
    POST("/baskets/{basketIdent}/coupons", {
      ...NO_STORE_OPTIONS,
      params: { path: { basketIdent: ident } },
      body: { coupon_code: code },
    }),
  );
  return refreshBasketAfter(ident, "applying coupon");
}

export async function removeCoupon(
  ident: string,
  code: string,
): Promise<Basket> {
  const { POST } = tebexClient();
  await resolveTebexResponse(
    POST("/baskets/{basketIdent}/coupons/remove", {
      ...NO_STORE_OPTIONS,
      params: { path: { basketIdent: ident } },
      body: { coupon_code: code },
    }),
  );
  return refreshBasketAfter(ident, "removing coupon");
}

export async function applyGiftCard(
  ident: string,
  cardNumber: string,
): Promise<Basket> {
  const { POST } = tebexClient();
  await resolveTebexResponse(
    POST("/baskets/{basketIdent}/giftcards", {
      ...NO_STORE_OPTIONS,
      params: { path: { basketIdent: ident } },
      body: { card_number: cardNumber },
    }),
  );
  return refreshBasketAfter(ident, "applying gift card");
}

export async function removeGiftCard(
  ident: string,
  cardNumber: string,
): Promise<Basket> {
  const { POST } = tebexClient();
  await resolveTebexResponse(
    POST("/baskets/{basketIdent}/giftcards/remove", {
      ...NO_STORE_OPTIONS,
      params: { path: { basketIdent: ident } },
      body: { card_number: cardNumber },
    }),
  );
  return refreshBasketAfter(ident, "removing gift card");
}

// A basket only ever has one active creator code at a time — confirmed by
// this project's own domain type (`Basket.creator_code: string | null`, not
// an array) — so applying a new one replaces rather than adds to the
// existing one; components/basket UI reflects that instead of treating it
// like the (multi-entry) coupon/gift-card lists.
export async function applyCreatorCode(
  ident: string,
  code: string,
): Promise<Basket> {
  const { POST } = tebexClient();
  await resolveTebexResponse(
    POST("/baskets/{basketIdent}/creator-codes", {
      ...NO_STORE_OPTIONS,
      params: { path: { basketIdent: ident } },
      body: { creator_code: code },
    }),
  );
  return refreshBasketAfter(ident, "applying creator code");
}

export async function removeCreatorCode(ident: string): Promise<Basket> {
  const { POST } = tebexClient();
  await resolveTebexResponse(
    POST("/baskets/{basketIdent}/creator-codes/remove", {
      ...NO_STORE_OPTIONS,
      params: { path: { basketIdent: ident } },
    }),
  );
  return refreshBasketAfter(ident, "removing creator code");
}
