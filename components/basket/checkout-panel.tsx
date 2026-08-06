"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useRef, useState } from "react";
import type { Basket } from "@/lib/tebex/types";
import { BasketSummary } from "./basket-summary";
import { completeCheckoutAction } from "./checkout-action";

// Tebex.js attaches itself to `window.Tebex` once loaded; not published as a
// types package, so the shape used by this file is declared locally.
declare global {
  interface Window {
    Tebex?: {
      checkout: {
        init: (config: {
          ident: string;
          theme?: "light" | "dark" | "auto" | "default";
        }) => void;
        launch: () => void;
        on: (
          event: "payment:complete" | "payment:error" | "close",
          callback: () => void,
        ) => void;
      };
    };
  }
}

/**
 * Wraps the basket summary with the Tebex.js checkout overlay and the
 * post-checkout confirmation state. A Client Component because launching and
 * reacting to the Tebex.js overlay is unavoidably interactive (per
 * AGENTS.md's Client Component convention) — `BasketSummary` itself stays a
 * plain, presentational component and is simply rendered from here.
 */
export function CheckoutPanel({
  basket,
  currency,
}: {
  basket: Basket;
  currency: string;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mirrors `complete` but readable synchronously from inside the Tebex.js
  // event callbacks below, which close over state from whenever `init` ran
  // rather than the latest render.
  const completeRef = useRef(false);
  const initializedRef = useRef(false);

  function initCheckout() {
    const tebex = window.Tebex;
    if (!tebex || initializedRef.current) return;
    initializedRef.current = true;

    // "auto" matches this store's own light/dark theming (see
    // themes/default.css) rather than forcing one look regardless of the
    // visitor's system preference.
    tebex.checkout.init({ ident: basket.ident, theme: "auto" });

    tebex.checkout.on("payment:complete", () => {
      completeRef.current = true;
      setComplete(true);
      completeCheckoutAction().then(() => router.refresh());
    });

    tebex.checkout.on("payment:error", () => {
      setError(
        "There was a problem processing your payment. Please try again.",
      );
    });

    tebex.checkout.on("close", () => {
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
    window.Tebex?.checkout.launch();
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
      <Script
        src="https://js.tebex.io/v/1.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <BasketSummary basket={basket} currency={currency} />
      <div className="mt-6 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={!scriptReady}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
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
