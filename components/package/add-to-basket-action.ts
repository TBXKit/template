"use server";

// Exporting from a "use server" file turns these functions into server-side
// RPC endpoints: add-to-basket-button.tsx (a Client Component) imports and
// calls `addToBasketAction` like a plain async function, but the call
// actually runs here, on the server.

import { revalidatePath } from "next/cache";
import { addPackageToBasket } from "@/lib/tebex";
import { ensureBasket } from "@/lib/tebex/session";

export type AddToBasketResult =
  | { success: true }
  | { success: false; error: string };

export async function addToBasketAction(
  packageId: number,
  quantity = 1,
  variableData?: Record<string, string>,
): Promise<AddToBasketResult> {
  try {
    const basket = await ensureBasket();
    await addPackageToBasket(basket.ident, packageId, quantity, variableData);
    // Broad on purpose: basket state affects the header's item count on
    // every page, not just this action's own route.
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Could not add this package to your basket. Please try again.",
    };
  }
}
