import type { Metadata } from "next";
import { BasketEmpty } from "@/components/basket/basket-empty";
import { BasketSummary } from "@/components/basket/basket-summary";
import { getWebstore } from "@/lib/tebex";
import { getCurrentBasket } from "@/lib/tebex/session";

export const metadata: Metadata = {
  title: "Your Basket",
};

export default async function CartPage() {
  const [basket, webstore] = await Promise.all([
    getCurrentBasket(),
    getWebstore(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Your Basket</h1>
      <div className="mt-8">
        {!basket || basket.packages.length === 0 ? (
          <BasketEmpty />
        ) : (
          <BasketSummary basket={basket} currency={webstore.currency} />
        )}
      </div>
    </div>
  );
}
