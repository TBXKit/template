import { CategoryGrid } from "@/components/category/category-grid";
import type { Category } from "@/lib/tebex/types";

/**
 * Section wrapper around the live `CategoryGrid` — adds a heading, doesn't
 * change `CategoryGrid`'s own behavior (including its empty-state handling
 * when no categories exist yet). The heading itself is generic, functional
 * UI copy (like "Search" or "Cart" elsewhere in this app), not a claim
 * about this specific store — unlike `ValueProposition`/`ClosingCta`, it
 * isn't placeholder content that needs rewriting.
 */
export function CategoryShowcase({
  categories,
  currency,
}: {
  categories: Category[];
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
        Shop our packages
      </h2>
      <CategoryGrid categories={categories} currency={currency} />
    </div>
  );
}
