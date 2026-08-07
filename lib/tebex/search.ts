import type { Category, Package } from "./types";

/**
 * Case-insensitive partial match against `getCategories()`'s already-cached
 * result — confirmed against Tebex's docs and the generated schema that no
 * category/package listing endpoint accepts a search/query parameter (see
 * ROADMAP.md Phase 10.1), so this is client/server-side filtering, not an
 * API call. Deduplicates by package id in case the same package ever
 * appears in more than one category.
 */
export function searchPackages(
  categories: Category[],
  query: string,
): Package[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const results = new Map<number, Package>();
  for (const category of categories) {
    for (const pkg of category.packages) {
      if (pkg.name.toLowerCase().includes(normalizedQuery)) {
        results.set(pkg.id, pkg);
      }
    }
  }
  return [...results.values()];
}
