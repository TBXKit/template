import { formatCurrency } from "@/lib/tebex/currency";
import type { Basket } from "@/lib/tebex/types";
import { BasketItem } from "./basket-item";

export function BasketSummary({
  basket,
  currency,
}: {
  basket: Basket;
  currency: string;
}) {
  const total = formatCurrency(basket.total_price, currency);

  return (
    <div>
      <ul>
        {basket.packages.map((item) => (
          <BasketItem key={item.id} item={item} currency={currency} />
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-medium text-foreground">Total</span>
        <span className="text-lg font-semibold text-primary">{total}</span>
      </div>
    </div>
  );
}
