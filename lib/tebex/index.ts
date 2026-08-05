import { resolveTebexResponse, tebexClient } from "./client";
import type { components } from "./generated/schema";
import { mapCategory, mapPackage, mapWebstore } from "./mapper";
import type { Category, Package, Webstore } from "./types";

const CACHE_OPTIONS = { next: { revalidate: 300 } } as const;

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
