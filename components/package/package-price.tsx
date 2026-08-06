import { formatCurrency } from "@/lib/tebex/currency";

export function PackagePrice({
  basePrice,
  totalPrice,
  discount,
  currency,
  className,
}: {
  basePrice: number;
  totalPrice: number;
  discount: number;
  currency: string;
  className?: string;
}) {
  const onSale = discount > 0 && totalPrice < basePrice;

  if (!onSale) {
    return (
      <span className={className}>{formatCurrency(totalPrice, currency)}</span>
    );
  }

  return (
    <span className={className}>
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground line-through">
          {formatCurrency(basePrice, currency)}
        </span>
        <span>{formatCurrency(totalPrice, currency)}</span>
        <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
          Sale
        </span>
      </span>
    </span>
  );
}
