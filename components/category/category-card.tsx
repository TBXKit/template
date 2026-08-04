import Link from "next/link";
import type { Category } from "@/lib/tebex/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.id}`}
      className="group flex flex-col rounded-lg border border-black/10 p-6 transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
    >
      <h3 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
        {category.name}
      </h3>
      {category.description ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {category.description}
        </p>
      ) : null}
      <span className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
        {category.packages.length}{" "}
        {category.packages.length === 1 ? "package" : "packages"}
      </span>
    </Link>
  );
}
