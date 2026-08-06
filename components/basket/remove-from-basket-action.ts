"use server";

// See add-to-basket-action.ts: exporting from a "use server" file makes
// these functions callable as server-side RPCs from a Client Component.

import { revalidatePath } from "next/cache";
import { removePackageFromBasket } from "@/lib/tebex";
import { getCurrentBasket } from "@/lib/tebex/session";

export type RemoveFromBasketResult =
  | { success: true }
  | { success: false; error: string };

export async function removeFromBasketAction(
  packageId: number,
): Promise<RemoveFromBasketResult> {
  try {
    const basket = await getCurrentBasket();
    if (!basket) {
      throw new Error("No basket to remove a package from");
    }

    await removePackageFromBasket(basket.ident, packageId);
    // Broad on purpose — see add-to-basket-action.ts: basket state affects
    // the header's item count on every page, not just /cart.
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Could not remove this item. Please try again.",
    };
  }
}
