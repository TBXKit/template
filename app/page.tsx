import { CategoryGrid } from "@/components/category/category-grid";
import { Hero } from "@/components/hero";
import { StorefrontIntro } from "@/components/storefront-intro";
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
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
        <StorefrontIntro storeName={webstore.name} />
        <CategoryGrid categories={categories} currency={webstore.currency} />
      </div>
    </>
  );
}
