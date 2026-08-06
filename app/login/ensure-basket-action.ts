"use server";

import { redirect } from "next/navigation";
import { ensureBasket } from "@/lib/tebex/session";

/**
 * Unblocks external-provider sign-in for a visitor with no basket yet (e.g.
 * a first-time visitor whose very first interaction is "gift this
 * package," which requires being signed in before a basket would otherwise
 * exist). The external-auth flow (`getBasketAuthProviders`) authorizes an
 * *existing* basket in place — but `app/login/page.tsx` is a Server
 * Component and can't create one during render (cookie writes are only
 * allowed from a Server Action/Route Handler — see `lib/tebex/session.ts`).
 * This Server Action creates an anonymous basket, then returns to `/login`,
 * where `getCurrentBasket()` now finds it and renders the real provider
 * links instead of the "add something to your basket first" dead end.
 */
export async function startSignInAction(next: string): Promise<void> {
  await ensureBasket();
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
