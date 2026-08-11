import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PackageDetail } from "@/components/package/package-detail";
import { SITE_URL } from "@/lib/site";
import { getPackage, getWebstore } from "@/lib/tebex";
import { buildProductJsonLd } from "./product-json-ld";

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

  // Renders the sibling `not-found.tsx` in this folder — Next.js wires that
  // up by file location, there's no import connecting the two.
  if (!pkg) notFound();

  const productJsonLd = buildProductJsonLd(
    pkg,
    webstore.currency,
    `${SITE_URL}/package/${pkg.id}`,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from server-fetched Tebex data, not user input
        dangerouslySetInnerHTML={{
          // pkg.name/pkg.description are store-owner-authored dashboard
          // content (see the doc comment on Package.description in
          // lib/tebex/types.ts) — "not user input" doesn't mean "can't
          // contain `</script>`". Escaping `<` prevents that sequence from
          // closing this script tag early and having the remainder parsed
          // as new HTML.
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: `/category/${pkg.category.id}`, label: pkg.category.name },
          { label: pkg.name },
        ]}
      />
      <PackageDetail
        pkg={pkg}
        currency={webstore.currency}
        supportsGifting={webstore.supports_gifting}
      />
    </div>
  );
}
