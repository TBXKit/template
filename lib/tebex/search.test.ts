import { describe, expect, it } from "vitest";
import { searchPackages } from "./search";
import type { Category, Package } from "./types";

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

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    name: "Ranks",
    description: "",
    packages: [],
    image_url: null,
    display_type: "grid",
    ...overrides,
  };
}

describe("searchPackages", () => {
  it("returns an empty array for a blank or whitespace-only query", () => {
    const categories = [
      buildCategory({ packages: [buildPackage({ name: "VIP Rank" })] }),
    ];

    expect(searchPackages(categories, "")).toEqual([]);
    expect(searchPackages(categories, "   ")).toEqual([]);
  });

  it("matches case-insensitively on a partial name", () => {
    const pkg = buildPackage({ name: "VIP Rank" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "vip")).toEqual([pkg]);
    expect(searchPackages(categories, "RANK")).toEqual([pkg]);
  });

  it("returns an empty array when nothing matches", () => {
    const categories = [
      buildCategory({ packages: [buildPackage({ name: "VIP Rank" })] }),
    ];

    expect(searchPackages(categories, "nonexistent")).toEqual([]);
  });

  it("searches across every category, not just the first", () => {
    const match = buildPackage({ id: 2, name: "MVP Rank" });
    const categories = [
      buildCategory({
        id: 1,
        packages: [buildPackage({ id: 1, name: "Cosmetics" })],
      }),
      buildCategory({ id: 2, packages: [match] }),
    ];

    expect(searchPackages(categories, "mvp")).toEqual([match]);
  });

  it("deduplicates a package that appears in more than one category", () => {
    const shared = buildPackage({ id: 1, name: "Shared Pack" });
    const categories = [
      buildCategory({ id: 1, packages: [shared] }),
      buildCategory({ id: 2, packages: [shared] }),
    ];

    expect(searchPackages(categories, "shared")).toEqual([shared]);
  });

  it("returns an empty array when there are no categories at all", () => {
    expect(searchPackages([], "anything")).toEqual([]);
  });
});
