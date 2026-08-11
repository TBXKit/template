import Link from "next/link";

/**
 * Starter closing call-to-action — plain JSX, meant to be rewritten per
 * store. Ships intentionally unfinished, same as `ValueProposition`: a
 * bracketed placeholder, not polished copy that could be mistaken for
 * finished and left in place.
 */
export function ClosingCta() {
  return (
    <div className="hud-frame flex flex-col items-center gap-4 rounded-lg border border-border px-8 py-12 text-center">
      <p className="max-w-xl text-balance text-foreground">
        {/* Replace with a real closing pitch — e.g. "Ready to level up?
            Grab a rank today." */}
        [Closing pitch goes here — give players a reason to buy now.]
      </p>
      <Link
        href="/search"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Browse the store
      </Link>
    </div>
  );
}
