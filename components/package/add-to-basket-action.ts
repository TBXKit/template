"use server";

// Exporting from a "use server" file turns these functions into server-side
// RPC endpoints: add-to-basket-button.tsx (a Client Component) imports and
// calls `addToBasketAction` like a plain async function, but the call
// actually runs here, on the server.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addPackageToBasket, getWebstore } from "@/lib/tebex";
import { ensureBasket, getCurrentUsername } from "@/lib/tebex/session";

export type AddToBasketResult =
  | { success: true }
  | { success: false; error: string };

export async function addToBasketAction(
  packageId: number,
  quantity: number,
  variableData: Record<string, string> | undefined,
  // Where to return to after logging in — see app/login/. Not used at all
  // on stores that don't require it.
  currentPath: string,
): Promise<AddToBasketResult> {
  // Gate *before* any basket exists rather than attempting the add and
  // catching Tebex's "must login" error: a username-auth store's basket can
  // only be created with a username, never have one attached afterwards
  // (see createBasket's doc comment), so there's no recoverable basket to
  // retry against once one is anonymously created here.
  const webstore = await getWebstore();
  if (webstore.supports_usernames && !(await getCurrentUsername())) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }

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
