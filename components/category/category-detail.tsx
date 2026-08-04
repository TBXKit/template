import type { Category } from "@/lib/tebex/types";
import { PackageCard } from "@/components/package/package-card";

export function CategoryDetail({
  category,
  currency,
}: {
  category: Category;
  currency: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        {category.name}
      </h1>
      {category.description ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {category.description}
        </p>
      ) : null}

      {category.packages.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {category.packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} currency={currency} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          No packages in this category yet.
        </p>
      )}
    </div>
  );
}
