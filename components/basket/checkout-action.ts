"use server";

// See add-to-basket-action.ts: exporting from a "use server" file makes this
// callable as a server-side RPC from a Client Component.

import { revalidatePath } from "next/cache";
import { clearBasketSession } from "@/lib/tebex/session";

/**
 * Called once Tebex.js reports `payment:complete`. The basket itself is left
 * alone on Tebex's side (it's now `complete`); this only drops this
 * visitor's local session so their next add-to-basket starts a fresh basket
 * instead of reusing the spent one.
 */
export async function completeCheckoutAction(): Promise<void> {
  await clearBasketSession();
  // Broad on purpose — see add-to-basket-action.ts: basket state affects the
  // header's item count on every page, not just /cart.
  revalidatePath("/", "layout");
}
