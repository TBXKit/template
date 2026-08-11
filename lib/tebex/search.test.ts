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

describe("searchPackages — baseline behavior", () => {
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

describe("searchPackages — gaps closed vs. the old substring-only matcher", () => {
  it("matches regardless of word order", () => {
    const pkg = buildPackage({ name: "VIP Rank" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "rank vip")).toEqual([pkg]);
  });

  it("matches a simple plural query against a singular name", () => {
    const pkg = buildPackage({ name: "VIP Rank" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "ranks")).toEqual([pkg]);
  });

  it("matches a plural formed by a silent-e word plus 's' (bundle/bundles)", () => {
    const pkg = buildPackage({ name: "Emerald VIP Bundle" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "bundles")).toEqual([pkg]);
  });

  it("fuzzy-matches an adjacent-letter transposition typo", () => {
    const pkg = buildPackage({ name: "VIP Rank" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "vpi rank")).toEqual([pkg]);
  });

  it("fuzzy-matches a missing-letter typo", () => {
    const pkg = buildPackage({ name: "VIP Rank" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "rnk")).toEqual([pkg]);
  });

  it("does not fuzzy-match a genuinely unrelated short word", () => {
    const pkg = buildPackage({ name: "VIP Rank" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "cat")).toEqual([]);
  });

  it("matches tokens that appear in the name but not contiguously", () => {
    const pkg = buildPackage({ name: "Emerald VIP Bundle" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "emerald bundle")).toEqual([pkg]);
  });

  it("matches tokens present in the name in a different order", () => {
    const pkg = buildPackage({ name: "Emerald VIP Bundle" });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "bundle vip")).toEqual([pkg]);
  });

  it("matches against the package description when the name doesn't match", () => {
    const pkg = buildPackage({
      name: "Starter Kit",
      description: "<p>Comes with a diamond sword and full armor set</p>",
    });
    const categories = [buildCategory({ packages: [pkg] })];

    expect(searchPackages(categories, "armor")).toEqual([pkg]);
    expect(searchPackages(categories, "diamond sword")).toEqual([pkg]);
  });
});

describe("searchPackages — relevance ranking", () => {
  it("ranks an exact phrase match in the name above a token-scattered match", () => {
    const exactMatch = buildPackage({ id: 1, name: "VIP Rank" });
    const scatteredMatch = buildPackage({
      id: 2,
      name: "Ultra VIP Ranking Bundle",
    });
    const categories = [
      buildCategory({ packages: [exactMatch, scatteredMatch] }),
    ];

    expect(searchPackages(categories, "VIP Rank")).toEqual([
      exactMatch,
      scatteredMatch,
    ]);
  });

  it("ranks a name match above a description-only match", () => {
    const nameMatch = buildPackage({ id: 1, name: "Armor Bundle" });
    const descriptionMatch = buildPackage({
      id: 2,
      name: "Starter Kit",
      description: "<p>Includes a full suit of armor</p>",
    });
    const categories = [
      buildCategory({ packages: [descriptionMatch, nameMatch] }),
    ];

    expect(searchPackages(categories, "armor")).toEqual([
      nameMatch,
      descriptionMatch,
    ]);
  });

  it("requires every query token to match — a package matching only some tokens is excluded", () => {
    const pkg = buildPackage({ name: "VIP Rank" });
    const categories = [buildCategory({ packages: [pkg] })];

    // "vip" matches, "spaceship" matches nothing in name or description.
    expect(searchPackages(categories, "vip spaceship")).toEqual([]);
  });
});
