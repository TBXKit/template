import type { PackageVariable } from "@/lib/tebex/types";

const INPUT_CLASSNAME =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

export function PackageVariableInput({
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
          className={INPUT_CLASSNAME}
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
          className={INPUT_CLASSNAME}
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
