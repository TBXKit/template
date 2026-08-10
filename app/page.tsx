import { CategoryGrid } from "@/components/category/category-grid";
import { GettingStarted } from "@/components/getting-started";
import { Hero } from "@/components/hero";
import { getCategories, getWebstore } from "@/lib/tebex";

export default async function HomePage() {
  // Defaults to template mode: this project ships as a fork-and-configure
  // template, so a first clone (token set, catalog usually not populated
  // yet) should show a generic placeholder rather than an empty/broken
  // storefront render. Set HOMEPAGE_MODE=storefront once the store's
  // catalog is built out. See README's "Homepage modes".
  if (process.env.HOMEPAGE_MODE !== "storefront") {
    const webstore = await getWebstore();
    return (
      <>
        <Hero
          title={webstore.name}
          description={webstore.description || undefined}
        />
        <div className="mx-auto max-w-6xl px-6 py-16">
          <GettingStarted />
        </div>
      </>
    );
  }

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
