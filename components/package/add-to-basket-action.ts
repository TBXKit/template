"use server";

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
    // Broad on purpose: no route reads basket state yet (that starts in
    // Phase 3), so there's no narrower path to target correctly today.
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Could not add this package to your basket. Please try again.",
    };
  }
}
