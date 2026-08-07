"use client";

import { usePathname } from "next/navigation";
import { useActionState } from "react";
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
  const [state, formAction, isPending] = useActionState(
    async () => addToBasketAction(packageId, 1, undefined, pathname, undefined),
    null,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary disabled:opacity-60"
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
