import type { Metadata } from "next";
import { PackageCard } from "@/components/package/package-card";
import { SearchForm } from "@/components/search-form";
import { getCategories, getWebstore } from "@/lib/tebex";
import { searchPackages } from "@/lib/tebex/search";

export const metadata: Metadata = {
  title: "Search",
  // Query-driven results page — excluded from indexing for the same reason
  // as /cart, /login, /account: not stable, indexable content.
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const params = await searchParams;
  const rawQuery = params.q;
  const query = typeof rawQuery === "string" ? rawQuery : "";

  const [categories, webstore] = await Promise.all([
    getCategories(),
    getWebstore(),
  ]);
  const results = searchPackages(categories, query);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Search</h1>
      <SearchForm defaultValue={query} className="mt-6 max-w-sm" />

      <div className="mt-8">
        {query.trim().length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Enter a search term above to find packages.
          </p>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                currency={webstore.currency}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No packages found for &quot;{query}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
