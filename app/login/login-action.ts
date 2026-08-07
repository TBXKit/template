"use server";

// See components/package/add-to-basket-action.ts: exporting from a
// "use server" file makes this callable as a server-side RPC from
// login-form.tsx (a Client Component).

import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { performAddToBasket } from "@/lib/tebex/add-to-basket";
import { takePendingAction } from "@/lib/tebex/pending-action";
import { setCurrentUsername } from "@/lib/tebex/session";
import { isSafeRedirectPath } from "./safe-redirect";

export type LoginResult = { success: false; error: string };

export async function loginAction(
  _prevState: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const username = String(formData.get("username") ?? "").trim();
  const next = String(formData.get("next") ?? "/");

  if (!username) {
    logger.warn("Login rejected: no username submitted");
    return { success: false, error: "Please enter a username." };
  }

  // No password: this mirrors the reference client's actual behavior for
  // username-auth stores, not an independent decision made here — Tebex
  // validates/creates the identity itself once a basket is created with it
  // (see lib/tebex/index.ts's createBasket).
  await setCurrentUsername(username);
  logger.info({ username }, "Login succeeded");

  // Replays the add-to-basket call that redirected here in the first place
  // (see add-to-basket-action.ts), if there was one. A failure here (e.g.
  // the package sold out while the visitor was signing in) is swallowed —
  // performAddToBasket already logs it, and the visitor is still correctly
  // signed in and on their way to `next`; they can just retry the add.
  const pending = await takePendingAction();
  if (pending) {
    await performAddToBasket(pending);
  }

  redirect(isSafeRedirectPath(next) ? next : "/");
}
