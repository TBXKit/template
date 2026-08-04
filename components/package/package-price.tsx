export function PackagePrice({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);

  return <span className={className}>{formatted}</span>;
}
