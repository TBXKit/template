import { CategoryGrid } from "@/components/category/category-grid";
import { Hero } from "@/components/hero";
import { getCategories, getWebstore } from "@/lib/tebex";

export default async function HomePage() {
  const [webstore, categories] = await Promise.all([
    getWebstore(),
    getCategories(),
  ]);

  return (
    <>
      <Hero
        title={webstore.name}
        description={webstore.description || undefined}
      />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <CategoryGrid categories={categories} currency={webstore.currency} />
      </div>
    </>
  );
}
