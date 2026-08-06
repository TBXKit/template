"use server";

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
    // Broad on purpose — see components/package/add-to-basket-action.ts.
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Could not remove this item. Please try again.",
    };
  }
}
