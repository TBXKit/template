"use client";

import { checkout } from "@tebexio/tebex.js";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Basket } from "@/lib/tebex/types";
import { BasketSummary } from "./basket-summary";
import { completeCheckoutAction } from "./checkout-action";
import { PromoCodes } from "./promo-codes";

/**
 * Fires a confetti burst once, on the actual moment of `payment:complete` —
 * not a component-level effect, since `complete` only flips once and this
 * has no state or props of its own to react to. `canvas-confetti` is a
 * dynamic `import()` rather than a top-level one so its code never ships in
 * the initial bundle a visitor loads to reach `/cart` at all, only once a
 * payment actually completes. Skipped under `prefers-reduced-motion` — it's
 * a delight, not information, so there's nothing lost by not animating it.
 */
function celebrate(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  import("canvas-confetti").then(({ default: confetti }) => {
    confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
  });
}

/**
 * Wraps the basket summary with the Tebex.js checkout overlay and the
 * post-checkout confirmation state. A Client Component because launching and
 * reacting to the Tebex.js overlay is unavoidably interactive (per
 * AGENTS.md's Client Component convention) — `BasketSummary` itself stays a
 * plain, presentational component and is simply rendered from here.
 *
 * Uses the `@tebexio/tebex.js` npm package rather than the CDN `<script>`
 * tag Tebex's docs also offer: it's the same library (confirmed against a
 * live checkout launch — its bundle includes the identical `zoid`-based
 * component), but ships real types and a plain ESM import instead of a
 * `window.Tebex` global, which fits this codebase's conventions better and
 * avoids a manual "has the script loaded yet" readiness gate. Importing it
 * has no import-time side effects (verified: it loads cleanly under plain
 * Node with no `window`/`document`), so it's safe from this Client
 * Component even though Next.js also renders Client Components on the
 * server for the initial HTML.
 */
export function CheckoutPanel({
  basket,
  currency,
}: {
  basket: Basket;
  currency: string;
}) {
  const router = useRouter();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mirrors `complete` but readable synchronously from inside the Tebex.js
  // event callbacks below, which close over state from whenever `init` ran
  // rather than the latest render.
  const completeRef = useRef(false);
  const initializedRef = useRef(false);

  function initCheckout() {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // "auto" matches this store's own light/dark theming (see
    // themes/default.css) rather than forcing one look regardless of the
    // visitor's system preference.
    checkout.init({ ident: basket.ident, theme: "auto" });

    checkout.on("payment:complete", () => {
      completeRef.current = true;
      setComplete(true);
      completeCheckoutAction().then(() => router.refresh());
      celebrate();
    });

    checkout.on("payment:error", () => {
      setError(
        "There was a problem processing your payment. Please try again.",
      );
    });

    checkout.on("close", () => {
      // A coupon or other basket-affecting action may have happened inside
      // the overlay even without a completed payment, so re-fetch rather
      // than assume the basket is unchanged. Skipped once payment has
      // completed — refreshing there would re-run this Server Component
      // with the now-cleared basket and swap the confirmation below back to
      // the empty-basket state.
      if (!completeRef.current) {
        router.refresh();
      }
    });
  }

  function handleCheckout() {
    initCheckout();
    checkout.launch();
  }

  if (complete) {
    return (
      <output className="block rounded-lg border border-border bg-card px-6 py-16 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Thank you for your purchase!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment was completed successfully.
        </p>
      </output>
    );
  }

  return (
    <div>
      <BasketSummary basket={basket} currency={currency} />
      <PromoCodes basket={basket} />
      <div className="mt-6 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleCheckout}
          className="focus-ring rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Checkout
        </button>
        {error ? (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
