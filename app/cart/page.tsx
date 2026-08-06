import type { Metadata } from "next";
import { BasketEmpty } from "@/components/basket/basket-empty";
import { CheckoutPanel } from "@/components/basket/checkout-panel";
import { getWebstore } from "@/lib/tebex";
import { getCurrentBasket } from "@/lib/tebex/session";

export const metadata: Metadata = {
  title: "Your Basket",
  // Per-visitor basket contents — never indexable content. Matches
  // /login, /account, /search; robots.ts itself stays a blanket `allow`
  // rather than also disallowing these paths, since combining a robots.txt
  // disallow with a page's own noindex is counterproductive (a disallowed
  // page can never be crawled, so the crawler never sees the noindex tag).
  robots: { index: false },
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
          <CheckoutPanel basket={basket} currency={webstore.currency} />
        )}
      </div>
    </div>
  );
}
