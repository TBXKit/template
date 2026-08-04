import { resolveTebexResponse, tebexClient } from "./client";
import type { Category, Package, Webstore } from "./types";

const CACHE_OPTIONS = { next: { revalidate: 300 } } as const;

export async function getWebstore(): Promise<Webstore> {
  const { GET } = tebexClient();
  const webstore = await resolveTebexResponse(GET("/", CACHE_OPTIONS));

  if (!webstore?.data) {
    throw new Error("Webstore data is unavailable");
  }

  return webstore.data as unknown as Webstore;
}

export async function getCategories(): Promise<Category[]> {
  const { GET } = tebexClient();
  const categories = await resolveTebexResponse(
    GET("/categories?includePackages=1", CACHE_OPTIONS),
  );

  return (categories?.data as unknown as Category[] | undefined) ?? [];
}

// Tebex returns 422 (not 404) for a category ID that doesn't exist.
export async function getCategory(id: number): Promise<Category | null> {
  const { GET } = tebexClient();
  const category = await resolveTebexResponse(
    GET("/categories/{categoryId}?includePackages=1", {
      ...CACHE_OPTIONS,
      params: { path: { categoryId: String(id) } },
    }),
    [404, 422],
  );

  // The OpenAPI schema reuses CategoryResponse (data: Category[]) for this
  // endpoint, but the live API returns a single Category object in `data`.
  return (category?.data as unknown as Category | undefined) ?? null;
}

// Tebex returns 400 (not 404) for a package ID that doesn't exist.
export async function getPackage(id: number): Promise<Package | null> {
  const { GET } = tebexClient();
  const pkg = await resolveTebexResponse(
    GET("/packages/{packageId}", {
      ...CACHE_OPTIONS,
      params: { path: { packageId: String(id) } },
    }),
    [400, 404],
  );

  // Likewise, PackageResponse types `data` as Package[], but this endpoint
  // returns a single Package object at runtime.
  return (pkg?.data as unknown as Package | undefined) ?? null;
}
