"use client";

import { useActionState } from "react";
import { addToBasketAction } from "./add-to-basket-action";

export function AddToBasketButton({ packageId }: { packageId: number }) {
  const [state, formAction, isPending] = useActionState(
    async () => addToBasketAction(packageId, 1),
    null,
  );

  return (
    <form action={formAction} className="mt-6">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add to basket"}
      </button>
      <div aria-live="polite" className="mt-2 text-sm">
        {state && !state.success ? (
          <p className="text-muted-foreground">{state.error}</p>
        ) : null}
        {state?.success ? (
          <p className="text-primary">Added to your basket.</p>
        ) : null}
      </div>
    </form>
  );
}
