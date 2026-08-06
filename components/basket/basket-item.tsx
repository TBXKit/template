import Image from "next/image";
import { formatCurrency } from "@/lib/tebex/currency";
import type { BasketPackage } from "@/lib/tebex/types";
import { RemoveFromBasketButton } from "./remove-from-basket-button";

export function BasketItem({
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
