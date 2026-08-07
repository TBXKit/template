import { describe, expect, it, vi } from "vitest";
import { performAddToBasket } from "./add-to-basket";
import type { Basket, Package } from "./types";

const { getPackage, addPackageToBasket, ensureBasket } = vi.hoisted(() => ({
  getPackage: vi.fn(),
  addPackageToBasket: vi.fn(),
  ensureBasket: vi.fn(),
}));

vi.mock("./index", () => ({ getPackage, addPackageToBasket }));
vi.mock("./session", () => ({ ensureBasket }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  redactBasketIdent: (ident: string) => ident,
}));

function buildPackage(overrides: Partial<Package> = {}): Package {
  return {
    id: 1,
    name: "VIP Rank",
    description: "",
    image: null,
    media: [],
    type: "single",
    base_price: 10,
    discount: 0,
    total_price: 10,
    expiration_date: null,
    category: { id: 1, name: "Ranks" },
    variables: [],
    disable_quantity: false,
    disable_gifting: false,
    ...overrides,
  };
}

function buildBasket(overrides: Partial<Basket> = {}): Basket {
  return {
    id: 1,
    ident: "basket-ident",
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

describe("performAddToBasket — success", () => {
  it("adds the requested quantity when the package allows it", async () => {
    getPackage.mockResolvedValueOnce(buildPackage({ disable_quantity: false }));
    ensureBasket.mockResolvedValueOnce(buildBasket());
    addPackageToBasket.mockResolvedValueOnce(buildBasket());

    const result = await performAddToBasket({
      packageId: 1,
      quantity: 5,
      variableData: undefined,
    });

    expect(result).toEqual({ success: true });
    expect(addPackageToBasket).toHaveBeenCalledWith(
      "basket-ident",
      1,
      5,
      undefined,
      undefined,
    );
  });

  it("clamps the quantity to 1 when the package disables quantity selection", async () => {
    getPackage.mockResolvedValueOnce(buildPackage({ disable_quantity: true }));
    ensureBasket.mockResolvedValueOnce(buildBasket());
    addPackageToBasket.mockResolvedValueOnce(buildBasket());

    await performAddToBasket({
      packageId: 1,
      quantity: 5,
      variableData: undefined,
    });

    expect(addPackageToBasket).toHaveBeenCalledWith(
      "basket-ident",
      1,
      1,
      undefined,
      undefined,
    );
  });
});

describe("performAddToBasket — failure", () => {
  it("returns a generic error for a non-gift failure", async () => {
    getPackage.mockResolvedValueOnce(buildPackage());
    ensureBasket.mockResolvedValueOnce(buildBasket());
    addPackageToBasket.mockRejectedValueOnce(new Error("Server error"));

    const result = await performAddToBasket({
      packageId: 1,
      quantity: 1,
      variableData: undefined,
    });

    expect(result).toEqual({
      success: false,
      error: "Could not add this package to your basket. Please try again.",
    });
  });

  it("surfaces the specific error message for a gift-target failure", async () => {
    getPackage.mockResolvedValueOnce(buildPackage());
    ensureBasket.mockResolvedValueOnce(buildBasket());
    addPackageToBasket.mockRejectedValueOnce(new Error("User not found"));

    const result = await performAddToBasket({
      packageId: 1,
      quantity: 1,
      variableData: undefined,
      giftUsername: "Notch",
    });

    expect(result).toEqual({ success: false, error: "User not found" });
  });
});
