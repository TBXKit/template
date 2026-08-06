import { cookies } from "next/headers";
import { createBasket, getBasket } from "./index";
import type { Basket } from "./types";

const BASKET_COOKIE = "tebex_basket_ident";
const BASKET_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 1 week

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
  }

  const created = await createBasket();
  store.set(BASKET_COOKIE, created.ident, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: BASKET_COOKIE_MAX_AGE,
  });
  return created;
}
