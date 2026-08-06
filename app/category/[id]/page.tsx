import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryDetail } from "@/components/category/category-detail";
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

  // Renders the sibling `not-found.tsx` in this folder — Next.js wires that
  // up by file location, there's no import connecting the two.
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <CategoryDetail category={category} currency={webstore.currency} />
    </div>
  );
}
