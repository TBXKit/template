import Link from "next/link";

/**
 * Shown on the homepage in place of `CategoryGrid` when `HOMEPAGE_MODE` is
 * unset or not `"storefront"` — the default first-run state for a
 * freshly-cloned store that has a `TEBEX_PUBLIC_TOKEN` but no populated
 * catalog yet. See `app/page.tsx`.
 */
export function GettingStarted() {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <h2 className="text-lg font-medium text-foreground">
        Your store isn&apos;t showing packages here yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Add categories and packages in your Tebex dashboard to start showing
        them here.
      </p>
      <Link
        href="/search"
        className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Browse the store
      </Link>
    </div>
  );
}
