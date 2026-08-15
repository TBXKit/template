import Image from "next/image";
import Link from "next/link";
import { PackageCard } from "@/components/package/package-card";
import { TebexHtml } from "@/components/tebex-html";
import type { Category } from "@/lib/tebex/types";

// How many packages a category shows inline on the homepage before handing
// off to its own /category/[id] page for the rest — enough to fill one row
// of the grid below at the desktop breakpoint.
const PREVIEW_LIMIT = 3;

export function CategoryGrid({
  categories,
  currency,
}: {
  categories: Category[];
  currency: string;
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        No categories yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16">
      {categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          currency={currency}
        />
      ))}
    </div>
  );
}

// Only ever rendered as one section of the list above — not exported, since
// nothing else in the app shows a category this way outside the homepage.
function CategorySection({
  category,
  currency,
}: {
  category: Category;
  currency: string;
}) {
  const preview = category.packages.slice(0, PREVIEW_LIMIT);
  const remaining = category.packages.length - preview.length;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Link
          href={`/category/${category.id}`}
          className="focus-ring group flex items-center gap-3"
        >
          {category.image_url ? (
            // alt="" is safe here: the category name right next to it is
            // always-visible text carrying the same information.
            <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={category.image_url}
                alt=""
                fill
                unoptimized
                sizes="40px"
                className="object-cover"
              />
            </span>
          ) : null}
          <h2 className="text-xl font-medium text-foreground group-hover:text-primary">
            {category.name}
          </h2>
        </Link>
        {remaining > 0 ? (
          <Link
            href={`/category/${category.id}`}
            className="focus-ring text-sm text-muted-foreground hover:text-foreground"
          >
            View all {category.packages.length} packages →
          </Link>
        ) : null}
      </div>
      {category.description ? (
        <TebexHtml html={category.description} className="mt-2 max-w-none" />
      ) : null}

      {preview.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} currency={currency} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No packages in this category yet.
        </div>
      )}
    </section>
  );
}
