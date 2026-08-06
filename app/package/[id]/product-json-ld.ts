import type { Package } from "@/lib/tebex/types";

/**
 * Builds the schema.org Product/Offer structured data rendered as JSON-LD on
 * the package detail page. Kept out of page.tsx so that file stays
 * fetch -> validate -> compose rather than mixing in data transformation.
 */
export function buildProductJsonLd(
  pkg: Package,
  currency: string,
  url: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.name,
    description: pkg.description || undefined,
    image: pkg.image || undefined,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: pkg.total_price,
      availability: "https://schema.org/InStock",
    },
  };
}
