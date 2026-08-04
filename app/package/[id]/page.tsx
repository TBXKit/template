import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageDetail } from "@/components/package/package-detail";
import { getPackage, getWebstore } from "@/lib/tebex";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

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

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.name,
    description: pkg.description || undefined,
    image: pkg.image || undefined,
    url: `${SITE_URL}/package/${pkg.id}`,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/package/${pkg.id}`,
      priceCurrency: webstore.currency,
      price: pkg.total_price,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from server-fetched Tebex data, not user input
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <PackageDetail pkg={pkg} currency={webstore.currency} />
    </div>
  );
}
