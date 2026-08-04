import { PackageCard } from "@/components/package/package-card";
import type { Category } from "@/lib/tebex/types";

export function CategoryDetail({
  category,
  currency,
}: {
  category: Category;
  currency: string;
}) {
  const isList = category.display_type === "list";

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
        <div
          className={
            isList
              ? "mt-8 flex flex-col gap-4"
              : "mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {category.packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              currency={currency}
              layout={isList ? "list" : "grid"}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No packages in this category yet.
        </div>
      )}
    </div>
  );
}
