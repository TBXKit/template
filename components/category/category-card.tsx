import Link from "next/link";
import type { Category } from "@/lib/tebex/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.id}`}
      className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
    >
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
    </Link>
  );
}
