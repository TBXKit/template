import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Next.js auto-maps this file to /robots.txt by name and location alone —
// there's no explicit route registration to find.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
