"use server";

// See add-to-basket-action.ts: exporting from a "use server" file makes
// these callable as server-side RPCs from promo-codes.tsx (a Client
// Component). All six live in one file, colocated with the one component
// that triggers them, rather than one file per action — unlike
// add-to-basket-action.ts/remove-from-basket-action.ts, which sit beside two
// *different* trigger components.

import { revalidatePath } from "next/cache";
import { logger, redactBasketIdent } from "@/lib/logger";
import {
  applyCoupon,
  applyCreatorCode,
  applyGiftCard,
  removeCoupon,
  removeCreatorCode,
  removeGiftCard,
} from "@/lib/tebex";
import { getCurrentBasket } from "@/lib/tebex/session";

export type PromoCodeResult =
  | { success: true }
  | { success: false; error: string };

// Unlike AddToBasketResult/RemoveFromBasketResult's fixed generic message,
// this surfaces the underlying error's own message: `lib/tebex/client.ts`
// extracts Tebex's own `detail` text (e.g. "The selected coupon code is
// invalid."), which is always written to be visitor-safe — a specific,
// actionable error rather than a generic "something went wrong." That same
// guarantee is why a caught error here logs at `warn`, not `error`: it's
// expected, recoverable, visitor-caused input, not a system failure.
async function runPromoCodeAction(
  event: string,
  mutate: (ident: string) => Promise<unknown>,
): Promise<PromoCodeResult> {
  try {
    const basket = await getCurrentBasket();
    if (!basket) {
      throw new Error("No basket to apply this to");
    }
    await mutate(basket.ident);
    logger.debug(
      { basketIdent: redactBasketIdent(basket.ident), event },
      "Promo code updated",
    );
    // Broad on purpose — see add-to-basket-action.ts: basket state affects
    // the header's item count and total on every page, not just /cart.
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    logger.warn({ event, err: error }, "Promo code action failed");
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not process this code. Please try again.",
    };
  }
}

export async function applyCouponAction(
  code: string,
): Promise<PromoCodeResult> {
  return runPromoCodeAction("coupon.apply", (ident) =>
    applyCoupon(ident, code),
  );
}

export async function removeCouponAction(
  code: string,
): Promise<PromoCodeResult> {
  return runPromoCodeAction("coupon.remove", (ident) =>
    removeCoupon(ident, code),
  );
}

export async function applyGiftCardAction(
  cardNumber: string,
): Promise<PromoCodeResult> {
  return runPromoCodeAction("gift-card.apply", (ident) =>
    applyGiftCard(ident, cardNumber),
  );
}

export async function removeGiftCardAction(
  cardNumber: string,
): Promise<PromoCodeResult> {
  return runPromoCodeAction("gift-card.remove", (ident) =>
    removeGiftCard(ident, cardNumber),
  );
}

export async function applyCreatorCodeAction(
  code: string,
): Promise<PromoCodeResult> {
  return runPromoCodeAction("creator-code.apply", (ident) =>
    applyCreatorCode(ident, code),
  );
}

export async function removeCreatorCodeAction(): Promise<PromoCodeResult> {
  return runPromoCodeAction("creator-code.remove", (ident) =>
    removeCreatorCode(ident),
  );
}
