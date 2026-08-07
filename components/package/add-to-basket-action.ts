"use server";

// Exporting from a "use server" file turns these functions into server-side
// RPC endpoints: add-to-basket-button.tsx (a Client Component) imports and
// calls `addToBasketAction` like a plain async function, but the call
// actually runs here, on the server.

import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { getWebstore } from "@/lib/tebex";
import {
  type AddToBasketResult,
  performAddToBasket,
} from "@/lib/tebex/add-to-basket";
import { setPendingAction } from "@/lib/tebex/pending-action";
import { getEffectiveUsername } from "@/lib/tebex/session";

export type { AddToBasketResult };

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
      // Recorded so the exact same add can be replayed automatically once
      // sign-in completes (app/login/login-action.ts) instead of dropping
      // the visitor's intent at the redirect. Only the username-login path
      // replays it — see the comment on `returnUrl` in app/login/page.tsx
      // for why the external-provider path can't do the same.
      await setPendingAction({
        packageId,
        quantity,
        variableData,
        giftUsername,
      });
      logger.debug(
        { packageId, gift: Boolean(giftUsername) },
        "Redirecting to login before add-to-basket",
      );
      redirect(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }

  return performAddToBasket({
    packageId,
    quantity,
    variableData,
    giftUsername,
  });
}
