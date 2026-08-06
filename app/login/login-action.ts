"use server";

// See components/package/add-to-basket-action.ts: exporting from a
// "use server" file makes this callable as a server-side RPC from
// login-form.tsx (a Client Component).

import { redirect } from "next/navigation";
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
    return { success: false, error: "Please enter a username." };
  }

  // No password: this mirrors the reference client's actual behavior for
  // username-auth stores, not an independent decision made here — Tebex
  // validates/creates the identity itself once a basket is created with it
  // (see lib/tebex/index.ts's createBasket).
  await setCurrentUsername(username);
  redirect(isSafeRedirectPath(next) ? next : "/");
}
