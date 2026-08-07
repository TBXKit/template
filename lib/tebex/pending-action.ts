import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

const PENDING_ACTION_COOKIE = "tebex_pending_action";
const PENDING_ACTION_MAX_AGE = 60 * 10; // 10 minutes — long enough to fill in a username, short enough that a stale intent doesn't resurface much later.

export interface PendingAddToBasketAction {
  packageId: number;
  quantity: number;
  variableData?: Record<string, string>;
  giftUsername?: string;
}

/**
 * Records the add-to-basket call a visitor was mid-submitting when they were
 * redirected to sign in, so it can be replayed once they're authenticated
 * instead of silently dropping their intent. Only callable from a Server
 * Action/Route Handler (writes a cookie) — see the same constraint on
 * `ensureBasket` in `./session.ts`.
 *
 * Not signed: every value it carries (package id, quantity, variable data,
 * gift username) is exactly what a visitor can already submit directly
 * through `addToBasketAction` itself, so a tampered cookie grants no
 * capability beyond what that action already accepts from any caller.
 */
export async function setPendingAction(
  action: PendingAddToBasketAction,
): Promise<void> {
  const store = await cookies();
  store.set(PENDING_ACTION_COOKIE, JSON.stringify(action), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_ACTION_MAX_AGE,
  });
}

/**
 * Reads and clears the pending action in one step — it's meant to be
 * replayed at most once, right after sign-in completes. Returns `null` for
 * a missing, expired, or malformed cookie rather than throwing, so a
 * corrupted value fails closed (silently dropped) instead of breaking the
 * sign-in flow it's attached to.
 */
export async function takePendingAction(): Promise<PendingAddToBasketAction | null> {
  const store = await cookies();
  const raw = store.get(PENDING_ACTION_COOKIE)?.value;
  if (!raw) return null;
  store.delete(PENDING_ACTION_COOKIE);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).packageId !== "number" ||
      typeof (parsed as Record<string, unknown>).quantity !== "number"
    ) {
      logger.debug("Pending action cookie had an unexpected shape; dropped");
      return null;
    }

    const record = parsed as Record<string, unknown>;
    return {
      packageId: record.packageId as number,
      quantity: record.quantity as number,
      variableData:
        typeof record.variableData === "object" && record.variableData !== null
          ? (record.variableData as Record<string, string>)
          : undefined,
      giftUsername:
        typeof record.giftUsername === "string"
          ? record.giftUsername
          : undefined,
    };
  } catch {
    logger.debug("Pending action cookie was not valid JSON; dropped");
    return null;
  }
}
