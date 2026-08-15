"use client";

import { usePathname } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useToast } from "@/components/toast-provider";
import { addToBasketAction } from "./add-to-basket-action";

/**
 * One-tap add-to-basket for a package that needs no further input —
 * package-card.tsx only renders this when `pkg.variables.length === 0`.
 * Always adds quantity 1; a package that needs a quantity choice, package
 * variables, or gifting still routes through its own detail page via the
 * card's own link, unaffected by this control.
 */
export function QuickAddButton({ packageId }: { packageId: number }) {
  const pathname = usePathname();
  const showToast = useToast();
  const [state, formAction, isPending] = useActionState(
    async () => addToBasketAction(packageId, 1, undefined, pathname, undefined),
    null,
  );

  // A card sits in a grid alongside others, so the inline text below is
  // easy to miss — this is the off-screen-safe copy of the same result.
  // `state` only changes when a new result actually lands (useActionState
  // doesn't re-fire it on unrelated re-renders), so this doesn't toast on
  // every render.
  useEffect(() => {
    if (!state) return;
    showToast(
      state.success ? "Added to your basket." : state.error,
      state.success ? "success" : "error",
    );
  }, [state, showToast]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary disabled:opacity-60"
      >
        {isPending ? "Adding…" : state?.success ? "Added" : "Add to basket"}
      </button>
      {state && !state.success ? (
        <p aria-live="polite" className="mt-1 text-xs text-muted-foreground">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
