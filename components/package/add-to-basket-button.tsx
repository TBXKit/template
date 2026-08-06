"use client";

import { useActionState, useState } from "react";
import type { PackageVariable } from "@/lib/tebex/types";
import { addToBasketAction } from "./add-to-basket-action";
import { PackageVariableInput } from "./package-variable-input";

export function AddToBasketButton({
  packageId,
  variables,
  disableQuantity,
}: {
  packageId: number;
  variables: PackageVariable[];
  disableQuantity: boolean;
}) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {},
  );
  const [quantity, setQuantity] = useState(1);

  const [state, formAction, isPending] = useActionState(
    async () => addToBasketAction(packageId, quantity, variableValues),
    null,
  );

  const allVariablesFilled = variables.every(
    (variable) => (variableValues[variable.identifier] ?? "").trim().length > 0,
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      {variables.map((variable) => (
        <PackageVariableInput
          key={variable.identifier}
          variable={variable}
          value={variableValues[variable.identifier] ?? ""}
          onChange={(value) =>
            setVariableValues((prev) => ({
              ...prev,
              [variable.identifier]: value,
            }))
          }
        />
      ))}

      <div className="flex items-center gap-3">
        {disableQuantity ? null : (
          <input
            type="number"
            min={1}
            step={1}
            required
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            aria-label="Quantity"
            className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        )}
        <button
          type="submit"
          disabled={isPending || !allVariablesFilled}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add to basket"}
        </button>
      </div>

      <div aria-live="polite" className="text-sm">
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
