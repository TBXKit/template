import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCard } from "@/components/package/package-card";
import { getCategory, getWebstore } from "@/lib/tebex";

export async function generateMetadata({
  params,
}: PageProps<"/category/[id]">): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategory(Number(id));

  if (!category) return {};

  return {
    title: category.name,
    description: category.description || undefined,
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/category/[id]">) {
  const { id } = await params;
  const [category, webstore] = await Promise.all([
    getCategory(Number(id)),
    getWebstore(),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {category.name}
      </h1>
      {category.description ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {category.description}
        </p>
      ) : null}

      {category.packages.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {category.packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} currency={webstore.currency} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
          No packages in this category yet.
        </p>
      )}
    </div>
  );
}
