"use server";

// Exporting from a "use server" file turns these functions into server-side
// RPC endpoints: add-to-basket-button.tsx (a Client Component) imports and
// calls `addToBasketAction` like a plain async function, but the call
// actually runs here, on the server.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger, redactBasketIdent } from "@/lib/logger";
import { addPackageToBasket, getPackage, getWebstore } from "@/lib/tebex";
import { ensureBasket, getEffectiveUsername } from "@/lib/tebex/session";

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
  // The target player's username, if this add is a gift — see
  // add-to-basket-button.tsx. Gifting always requires the giver to be
  // logged in, independent of whether the store requires login for
  // ordinary purchases (`webstore.supports_usernames`).
  giftUsername?: string,
): Promise<AddToBasketResult> {
  // Gate *before* any basket exists rather than attempting the add and
  // catching Tebex's "must login" error: a username-auth store's basket can
  // only be created with a username, never have one attached afterwards
  // (see createBasket's doc comment), so there's no recoverable basket to
  // retry against once one is anonymously created here. Skipped entirely
  // (no extra fetch) when neither condition applies — the common case.
  const webstore = await getWebstore();
  if (webstore.supports_usernames || giftUsername) {
    const username = await getEffectiveUsername();
    if (!username) {
      logger.debug(
        { packageId, gift: Boolean(giftUsername) },
        "Redirecting to login before add-to-basket",
      );
      redirect(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }

  try {
    // The UI never lets a visitor submit anything but 1 when the package
    // disables quantity selection, but the Server Action itself is a public
    // RPC endpoint — a direct call bypassing the form (or a tampered client
    // bundle) could submit any value. Re-check server-side rather than
    // trusting the client's `quantity` unconditionally.
    const pkg = await getPackage(packageId);
    const effectiveQuantity = pkg?.disable_quantity ? 1 : quantity;

    const basket = await ensureBasket();
    await addPackageToBasket(
      basket.ident,
      packageId,
      effectiveQuantity,
      variableData,
      giftUsername,
    );
    logger.info(
      {
        basketIdent: redactBasketIdent(basket.ident),
        packageId,
        quantity: effectiveQuantity,
        gift: Boolean(giftUsername),
      },
      "Package added to basket",
    );
    // Broad on purpose: basket state affects the header's item count on
    // every page, not just this action's own route.
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    // A gift-target failure carries a specific, actionable message from
    // Tebex (e.g. "User not found") — worth surfacing exactly, unlike a
    // plain add's generic fallback. That same distinction sets the log
    // level: an unresolvable gift target is visitor-caused and recoverable
    // (they can retry with a different username), while the
    // generic-fallback branch means something wasn't recognized as safe to
    // explain and deserves a closer look.
    const giftTargetError =
      giftUsername && error instanceof Error ? error.message : undefined;

    if (giftTargetError) {
      logger.warn(
        { packageId, err: error },
        "Gift target could not be resolved",
      );
    } else {
      logger.error(
        { packageId, err: error },
        "Failed to add package to basket",
      );
    }

    return {
      success: false,
      error:
        giftTargetError ??
        "Could not add this package to your basket. Please try again.",
    };
  }
}
