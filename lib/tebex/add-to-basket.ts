// Deliberately has no "use server" directive. This is called from two
// places — components/package/add-to-basket-action.ts's Server Action, and
// app/login/login-action.ts's post-login resume path — and every export of
// a "use server" file becomes its own client-callable RPC endpoint (see
// add-to-basket-action.ts's file-level comment). Sharing this logic without
// also making it independently reachable from the client keeps it a plain
// server-only helper, callable by anything already running on the server.
// Lives here rather than beside either caller: it's reusable domain logic
// that doesn't depend on how a route renders itself (see AGENTS.md's
// Repository Structure section on what belongs in lib/ vs. app/).

import { revalidatePath } from "next/cache";
import { logger, redactBasketIdent } from "@/lib/logger";
import { addPackageToBasket, getPackage } from "./index";
import { ensureBasket } from "./session";

export type AddToBasketResult =
  | { success: true }
  | { success: false; error: string };

export async function performAddToBasket({
  packageId,
  quantity,
  variableData,
  giftUsername,
}: {
  packageId: number;
  quantity: number;
  variableData?: Record<string, string>;
  giftUsername?: string;
}): Promise<AddToBasketResult> {
  // A Server Action is a public RPC endpoint (see add-to-basket-action.ts's
  // file-level comment) — the button's own onChange guard stops the UI from
  // producing an invalid quantity, but a direct call to this function (or
  // the action wrapping it) can still supply anything. Checked before the
  // try block below: this is an input-shape problem, not a Tebex API
  // failure, so it doesn't belong in that block's error handling/logging.
  if (!Number.isFinite(quantity) || quantity < 1) {
    logger.warn(
      { packageId, quantity },
      "Rejected add-to-basket: invalid quantity",
    );
    return {
      success: false,
      error: "Please enter a valid quantity of 1 or more.",
    };
  }

  try {
    // The UI never lets a visitor submit anything but 1 when the package
    // disables quantity selection, but this can be called with any
    // caller-supplied `quantity` — re-check server-side rather than
    // trusting it unconditionally.
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
    logger.debug(
      {
        basketIdent: redactBasketIdent(basket.ident),
        packageId,
        quantity: effectiveQuantity,
        gift: Boolean(giftUsername),
      },
      "Package added to basket",
    );
    // Broad on purpose: basket state affects the header's item count on
    // every page, not just the route that triggered this add.
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
