import { cookies } from "next/headers";
import { logger, redactBasketIdent } from "@/lib/logger";
import { createBasket, getBasket } from "./index";
import type { Basket } from "./types";

const BASKET_COOKIE = "tebex_basket_ident";
const BASKET_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 1 week

// Separate from BASKET_COOKIE because a username has to be known *before* a
// basket is created (see `createBasket`'s doc comment: there's no way to
// attach one to a basket after the fact) — this is captured by the login
// form (`app/login/`) ahead of the basket even existing, then consumed by
// `ensureBasket` below the first time a basket actually needs creating.
const USERNAME_COOKIE = "tebex_username";
const USERNAME_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 1 week, matching the basket cookie

/**
 * Read-only: safe to call from Server Components, layouts, and Server
 * Actions. Never creates a basket or writes a cookie — Next.js only allows
 * cookie writes from a Server Action/Route Handler, and a visitor who
 * hasn't added anything yet shouldn't get a basket created just by loading
 * a page. Returns `null` if there's no cookie yet or the basket has expired.
 */
export async function getCurrentBasket(): Promise<Basket | null> {
  const store = await cookies();
  const ident = store.get(BASKET_COOKIE)?.value;
  if (!ident) return null;

  return getBasket(ident);
}

/**
 * Read-or-create: only callable from a Server Action or Route Handler,
 * since it may call `cookies().set()`. Use this at the start of any basket
 * mutation (add to basket, apply a coupon, ...) to guarantee a valid basket
 * exists before acting on it.
 */
export async function ensureBasket(): Promise<Basket> {
  const store = await cookies();
  const ident = store.get(BASKET_COOKIE)?.value;

  if (ident) {
    const existing = await getBasket(ident);
    if (existing) return existing;
    // The cookie pointed at an ident Tebex no longer recognizes (expired or
    // otherwise gone) — falling through to create a fresh one is the
    // intended, transparent recovery, not an error, but worth a debug trace
    // since it explains why a visitor's basket ident changed mid-session.
    logger.debug(
      { basketIdent: redactBasketIdent(ident) },
      "Basket cookie pointed at an expired/missing basket; creating a new one",
    );
  }

  // Attaches a known username (if the visitor already logged in via
  // app/login) to the basket at the moment it's created — the only point
  // Tebex allows setting one. A username-auth store with no stored username
  // yet is expected to have already redirected to /login before reaching
  // here (see components/package/add-to-basket-action.ts); this is just the
  // mechanical "use it if we have it" half.
  const username = store.get(USERNAME_COOKIE)?.value;
  const created = await createBasket(username);
  logger.info(
    { basketIdent: redactBasketIdent(created.ident), username },
    "Basket created",
  );
  store.set(BASKET_COOKIE, created.ident, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: BASKET_COOKIE_MAX_AGE,
  });
  return created;
}

/**
 * Read-only: safe anywhere, same as `getCurrentBasket`. Reflects a username
 * the visitor has submitted via `app/login` even before any basket exists
 * yet (once a basket exists, `basket.username` — set at creation time and
 * unchangeable after — is the authoritative value; this cookie is only the
 * pre-basket signal).
 */
export async function getCurrentUsername(): Promise<string | null> {
  const store = await cookies();
  return store.get(USERNAME_COOKIE)?.value ?? null;
}

/**
 * Read-only: safe anywhere. The one signal for "is this visitor logged in"
 * — prefers `basket.username` (authoritative once a basket exists) and
 * falls back to the pre-basket cookie otherwise. Used by both
 * `app/layout.tsx` (header state) and the gift-gating check in
 * `components/package/add-to-basket-action.ts`.
 */
export async function getEffectiveUsername(): Promise<string | null> {
  const basket = await getCurrentBasket();
  return basket?.username ?? getCurrentUsername();
}

/**
 * Only callable from a Server Action or Route Handler. Called once by the
 * login form's Server Action; `ensureBasket` picks it up the next time a
 * basket actually needs creating.
 */
export async function setCurrentUsername(username: string): Promise<void> {
  const store = await cookies();
  store.set(USERNAME_COOKIE, username, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: USERNAME_COOKIE_MAX_AGE,
  });
}

/**
 * Clears the basket-ident cookie once a basket is done being useful (e.g.
 * after a completed checkout) so the next add-to-basket call starts a fresh
 * one. Only callable from a Server Action or Route Handler, same as
 * `ensureBasket`. Does not touch the basket on Tebex's side — a completed
 * basket is left as-is; this only stops this visitor from reusing its ident.
 */
export async function clearBasketSession(): Promise<void> {
  const store = await cookies();
  store.delete(BASKET_COOKIE);
}

/**
 * Logs the visitor out: clears both the username and basket cookies.
 *
 * Deliberate decision (per AGENTS.md/ROADMAP.md Phase 7.4 — don't copy the
 * reference's basket-teardown-on-logout without reconsidering it here):
 * this project ties the two together on purpose, not by default. A
 * basket's `username` can only be set at creation time (confirmed — see
 * `createBasket`'s doc comment) and never unset, so keeping the same
 * basket after "logging out" would leave a basket that's still,
 * server-side, associated with the old identity while the header claims
 * the visitor is signed out — an inconsistency, not a neutral choice.
 * Clearing both guarantees the next basket (created on the next
 * add-to-basket) starts genuinely anonymous.
 */
export async function clearAuthSession(): Promise<void> {
  const store = await cookies();
  store.delete(USERNAME_COOKIE);
  store.delete(BASKET_COOKIE);
}
