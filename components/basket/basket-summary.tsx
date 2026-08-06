import Image from "next/image";
import { formatCurrency } from "@/lib/tebex/currency";
import type { Basket, BasketPackage } from "@/lib/tebex/types";
import { RemoveFromBasketButton } from "./remove-from-basket-button";

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

// One line item of the basket above — not exported, since a basket package
// row is only ever shown as part of this summary.
function BasketItem({
  item,
  currency,
}: {
  item: BasketPackage;
  currency: string;
}) {
  const price = formatCurrency(item.price, currency);

  return (
    <li className="flex items-center gap-4 border-b border-border py-4 last:border-b-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            unoptimized
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-card-foreground">{item.name}</p>
        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
        <div className="mt-1">
          <RemoveFromBasketButton packageId={item.id} />
        </div>
      </div>
      <p className="text-sm font-medium text-foreground">{price}</p>
    </li>
  );
}
