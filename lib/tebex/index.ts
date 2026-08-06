import {
  basketPackageRequest,
  resolveTebexResponse,
  tebexClient,
} from "./client";
import type { components } from "./generated/schema";
import { mapBasket, mapCategory, mapPackage, mapWebstore } from "./mapper";
import type { Basket, Category, Package, Webstore } from "./types";

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

export async function createBasket(): Promise<Basket> {
  const { POST } = tebexClient();
  const result = await resolveTebexResponse(POST("/baskets", NO_STORE_OPTIONS));

  if (!result?.data) {
    throw new Error("Basket creation failed: no basket returned");
  }
  return mapBasket(result.data);
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
