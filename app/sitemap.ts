import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/tebex";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategories();

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const packageEntries: MetadataRoute.Sitemap = categories.flatMap((category) =>
    category.packages.map((pkg) => ({
      url: `${SITE_URL}/package/${pkg.id}`,
      changeFrequency: "weekly",
      priority: 0.6,
    })),
  );

  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    ...categoryEntries,
    ...packageEntries,
  ];
}
