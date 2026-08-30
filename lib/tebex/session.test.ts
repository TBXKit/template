import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Basket } from "./types";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
const { getBasket, createBasket } = vi.hoisted(() => ({
  getBasket: vi.fn(),
  createBasket: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies }));
vi.mock("./index", () => ({ getBasket, createBasket }));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  redactBasketIdent: (ident: string) => ident,
}));

import {
  clearAuthSession,
  clearBasketSession,
  ensureBasket,
  getCurrentBasket,
  getCurrentUsername,
  getEffectiveUsername,
  setCurrentUsername,
} from "./session";

const BASKET_COOKIE = "tebex_basket_ident";
const USERNAME_COOKIE = "tebex_username";

type CookieRecord = {
  set: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Minimal stand-in for Next's cookie store: get/set/delete over a Map, with
// set/delete spied so tests can assert on the options passed.
function fakeCookieStore(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  const store = {
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) as string } : undefined,
    set: vi.fn((name: string, value: string) => {
      jar.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      jar.delete(name);
    }),
  };
  return store as typeof store & CookieRecord;
}

function buildBasket(overrides: Partial<Basket> = {}): Basket {
  return {
    id: 1,
    ident: "basket-abc",
    complete: false,
    packages: [],
    coupons: [],
    giftcards: [],
    creator_code: null,
    base_price: 0,
    total_price: 0,
    currency: "USD",
    username: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentBasket", () => {
  it("returns null and never reads Tebex when there's no basket cookie", async () => {
    cookies.mockResolvedValue(fakeCookieStore());

    expect(await getCurrentBasket()).toBeNull();
    expect(getBasket).not.toHaveBeenCalled();
  });

  it("resolves the cookie's ident through getBasket", async () => {
    cookies.mockResolvedValue(fakeCookieStore({ [BASKET_COOKIE]: "id-1" }));
    const basket = buildBasket({ ident: "id-1" });
    getBasket.mockResolvedValue(basket);

    expect(await getCurrentBasket()).toBe(basket);
    expect(getBasket).toHaveBeenCalledWith("id-1");
  });

  it("passes through a null from an expired ident", async () => {
    cookies.mockResolvedValue(fakeCookieStore({ [BASKET_COOKIE]: "stale" }));
    getBasket.mockResolvedValue(null);

    expect(await getCurrentBasket()).toBeNull();
  });
});

describe("ensureBasket", () => {
  it("reuses a still-valid basket without creating one or touching cookies", async () => {
    const store = fakeCookieStore({ [BASKET_COOKIE]: "id-1" });
    cookies.mockResolvedValue(store);
    const basket = buildBasket({ ident: "id-1" });
    getBasket.mockResolvedValue(basket);

    expect(await ensureBasket()).toBe(basket);
    expect(createBasket).not.toHaveBeenCalled();
    expect(store.set).not.toHaveBeenCalled();
  });

  it("creates a fresh basket and stores its ident when the cookie is stale", async () => {
    const store = fakeCookieStore({ [BASKET_COOKIE]: "stale" });
    cookies.mockResolvedValue(store);
    getBasket.mockResolvedValue(null);
    createBasket.mockResolvedValue(buildBasket({ ident: "new-id" }));

    const result = await ensureBasket();

    expect(result.ident).toBe("new-id");
    expect(store.set).toHaveBeenCalledWith(
      BASKET_COOKIE,
      "new-id",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
    );
  });

  it("attaches a stored username to the basket it creates", async () => {
    cookies.mockResolvedValue(fakeCookieStore({ [USERNAME_COOKIE]: "Notch" }));
    createBasket.mockResolvedValue(buildBasket({ username: "Notch" }));

    await ensureBasket();

    expect(createBasket).toHaveBeenCalledWith("Notch");
  });

  it("creates an anonymous basket when no username is on file", async () => {
    cookies.mockResolvedValue(fakeCookieStore());
    createBasket.mockResolvedValue(buildBasket());

    await ensureBasket();

    expect(createBasket).toHaveBeenCalledWith(undefined);
  });
});

describe("getEffectiveUsername", () => {
  it("prefers the basket's username over the pre-basket cookie", async () => {
    cookies.mockResolvedValue(
      fakeCookieStore({
        [BASKET_COOKIE]: "id-1",
        [USERNAME_COOKIE]: "cookie-name",
      }),
    );
    getBasket.mockResolvedValue(buildBasket({ username: "basket-name" }));

    expect(await getEffectiveUsername()).toBe("basket-name");
  });

  it("falls back to the cookie when the basket has no username", async () => {
    cookies.mockResolvedValue(
      fakeCookieStore({
        [BASKET_COOKIE]: "id-1",
        [USERNAME_COOKIE]: "cookie-name",
      }),
    );
    getBasket.mockResolvedValue(buildBasket({ username: null }));

    expect(await getEffectiveUsername()).toBe("cookie-name");
  });

  it("uses the cookie when there's no basket at all", async () => {
    cookies.mockResolvedValue(
      fakeCookieStore({ [USERNAME_COOKIE]: "cookie-name" }),
    );

    expect(await getEffectiveUsername()).toBe("cookie-name");
  });

  it("returns null with neither a basket nor a username cookie", async () => {
    cookies.mockResolvedValue(fakeCookieStore());

    expect(await getEffectiveUsername()).toBeNull();
  });
});

describe("username cookie accessors", () => {
  it("getCurrentUsername reads the cookie, or null", async () => {
    cookies.mockResolvedValueOnce(
      fakeCookieStore({ [USERNAME_COOKIE]: "Alex" }),
    );
    expect(await getCurrentUsername()).toBe("Alex");

    cookies.mockResolvedValueOnce(fakeCookieStore());
    expect(await getCurrentUsername()).toBeNull();
  });

  it("setCurrentUsername writes the username cookie with the expected options", async () => {
    const store = fakeCookieStore();
    cookies.mockResolvedValue(store);

    await setCurrentUsername("Alex");

    expect(store.set).toHaveBeenCalledWith(
      USERNAME_COOKIE,
      "Alex",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
    );
  });
});

describe("session teardown", () => {
  it("clearBasketSession deletes only the basket cookie", async () => {
    const store = fakeCookieStore({
      [BASKET_COOKIE]: "id-1",
      [USERNAME_COOKIE]: "Alex",
    });
    cookies.mockResolvedValue(store);

    await clearBasketSession();

    expect(store.delete).toHaveBeenCalledWith(BASKET_COOKIE);
    expect(store.delete).not.toHaveBeenCalledWith(USERNAME_COOKIE);
  });

  it("clearAuthSession deletes both the username and basket cookies", async () => {
    const store = fakeCookieStore({
      [BASKET_COOKIE]: "id-1",
      [USERNAME_COOKIE]: "Alex",
    });
    cookies.mockResolvedValue(store);

    await clearAuthSession();

    expect(store.delete).toHaveBeenCalledWith(USERNAME_COOKIE);
    expect(store.delete).toHaveBeenCalledWith(BASKET_COOKIE);
  });
});
