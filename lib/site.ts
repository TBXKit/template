/**
 * Canonical absolute URL this store is deployed at — used to build absolute
 * URLs for `robots.txt`, `sitemap.xml`, Open Graph metadata, and the package
 * page's JSON-LD.
 *
 * `SITE_URL` is the explicit knob (set it on any host; the Dockerfile bakes
 * it in at build time). On Vercel, if it's unset, fall back to
 * `VERCEL_PROJECT_PRODUCTION_URL` — a documented system env var that is
 * always the project's production domain, "useful to reliably generate links
 * that point to production such as OG-image URLs"
 * (https://vercel.com/docs/environment-variables/system-environment-variables)
 * — so a Vercel deploy has correct absolute URLs without extra config. Falls
 * back to localhost for local development.
 */
export const SITE_URL =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
