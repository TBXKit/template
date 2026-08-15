"use client";

import { useActionState } from "react";
import { removeFromBasketAction } from "./remove-from-basket-action";

export function RemoveFromBasketButton({ packageId }: { packageId: number }) {
  const [state, formAction, isPending] = useActionState(
    async () => removeFromBasketAction(packageId),
    null,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring rounded-sm text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-60"
      >
        {isPending ? "Removing…" : "Remove"}
      </button>
      {state && !state.success ? (
        <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
