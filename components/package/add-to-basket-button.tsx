"use client";

import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";
import type { PackageVariable } from "@/lib/tebex/types";
import { addToBasketAction } from "./add-to-basket-action";

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
  const pathname = usePathname();

  const [state, formAction, isPending] = useActionState(
    async () =>
      addToBasketAction(packageId, quantity, variableValues, pathname),
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

const VARIABLE_INPUT_CLASSNAME =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

// One row of the variable form above — not exported, since a package
// variable is only ever collected as part of this add-to-basket flow.
function PackageVariableInput({
  variable,
  value,
  onChange,
}: {
  variable: PackageVariable;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = `variable-${variable.identifier}`;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-foreground"
      >
        {variable.identifier}
      </label>
      {variable.type === "dropdown" ? (
        <select
          id={inputId}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={VARIABLE_INPUT_CLASSNAME}
        >
          <option value="" disabled>
            Select an option
          </option>
          {variable.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={VARIABLE_INPUT_CLASSNAME}
          {...variableInputAttributes(variable.type)}
        />
      )}
    </div>
  );
}

function variableInputAttributes(
  type: Exclude<PackageVariable["type"], "dropdown">,
): {
  type: string;
  inputMode?: "numeric" | "text" | "email";
  pattern?: string;
} {
  switch (type) {
    case "numeric":
      return { type: "text", inputMode: "numeric", pattern: "[0-9]*" };
    case "alpha":
      return { type: "text", pattern: "[A-Za-z]*" };
    case "alphanumeric":
      return { type: "text", pattern: "[A-Za-z0-9]*" };
    case "email":
      return { type: "email" };
    default:
      // "username" and "text" are both free-form.
      return { type: "text" };
  }
}
