import type { Category } from "@/lib/tebex/types";
import { CategoryCard } from "./category-card";

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
