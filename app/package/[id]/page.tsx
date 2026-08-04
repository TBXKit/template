import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageDetail } from "@/components/package/package-detail";
import { getPackage, getWebstore } from "@/lib/tebex";

export async function generateMetadata({
  params,
}: PageProps<"/package/[id]">): Promise<Metadata> {
  const { id } = await params;
  const pkg = await getPackage(Number(id));

  if (!pkg) return {};

  return {
    title: pkg.name,
    description: pkg.description || undefined,
  };
}

export default async function PackagePage({
  params,
}: PageProps<"/package/[id]">) {
  const { id } = await params;
  const [pkg, webstore] = await Promise.all([
    getPackage(Number(id)),
    getWebstore(),
  ]);

  if (!pkg) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PackageDetail pkg={pkg} currency={webstore.currency} />
    </div>
  );
}
