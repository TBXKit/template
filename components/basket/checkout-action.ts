"use server";

// See add-to-basket-action.ts: exporting from a "use server" file makes this
// callable as a server-side RPC from a Client Component.

import { revalidatePath } from "next/cache";
import { logger, redactBasketIdent } from "@/lib/logger";
import { clearBasketSession, getCurrentBasket } from "@/lib/tebex/session";

/**
 * Called once Tebex.js reports `payment:complete`. The basket itself is left
 * alone on Tebex's side (it's now `complete`); this only drops this
 * visitor's local session so their next add-to-basket starts a fresh basket
 * instead of reusing the spent one.
 */
export async function completeCheckoutAction(): Promise<void> {
  // Read before clearing purely so the completion log below can reference
  // which basket finished checkout — clearBasketSession only deletes the
  // cookie, it doesn't need the basket itself.
  const basket = await getCurrentBasket();
  await clearBasketSession();
  logger.info(
    { basketIdent: basket ? redactBasketIdent(basket.ident) : undefined },
    "Checkout completed",
  );
  // Broad on purpose — see add-to-basket-action.ts: basket state affects the
  // header's item count on every page, not just /cart.
  revalidatePath("/", "layout");
}
