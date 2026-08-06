/**
 * Canonical absolute URL this store is deployed at — used to build absolute
 * URLs for `robots.txt`, `sitemap.xml`, Open Graph metadata, and the package
 * page's JSON-LD. Falls back to localhost for local development.
 */
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
