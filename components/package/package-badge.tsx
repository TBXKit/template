import type { PackageType } from "@/lib/tebex/types";

const LABELS: Record<PackageType, string> = {
  subscription: "Subscription",
  single: "One-time purchase",
};

export function PackageBadge({
  type,
  className,
}: {
  type: PackageType;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-sm border border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground ${className ?? ""}`}
    >
      {LABELS[type]}
    </span>
  );
}
