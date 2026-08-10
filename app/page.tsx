import { CategoryShowcase } from "@/components/category-showcase";
import { ClosingCta } from "@/components/closing-cta";
import { Hero } from "@/components/hero";
import { ValueProposition } from "@/components/value-proposition";
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
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        <ValueProposition />
        <CategoryShowcase
          categories={categories}
          currency={webstore.currency}
        />
        <ClosingCta />
      </div>
    </>
  );
}
