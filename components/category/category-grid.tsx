import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/tebex/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        No categories yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

// Only ever rendered as one tile of the grid above — not exported, since
// nothing else in the app shows a category outside this context.
function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary"
    >
      <div className="relative aspect-video w-full bg-muted">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-medium text-card-foreground">
          {category.name}
        </h3>
        {category.description ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {category.description}
          </p>
        ) : null}
        <span className="mt-4 text-sm text-muted-foreground">
          {category.packages.length}{" "}
          {category.packages.length === 1 ? "package" : "packages"}
        </span>
      </div>
    </Link>
  );
}
