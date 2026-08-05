import { describe, expect, it } from "vitest";
import type { components } from "./generated/schema";
import { mapCategory, mapPackage, mapWebstore } from "./mapper";

// The generated schema doesn't declare `supports_usernames` / `supports_gifting`
// on Webstore even though the live API returns them (see mapper.ts) — extend
// the fixture type locally to mirror what mapWebstore actually receives.
type RawWebstore = components["schemas"]["Webstore"] & {
  supports_usernames?: boolean;
  supports_gifting?: boolean;
};
type RawCategory = components["schemas"]["Category"];
type RawPackage = components["schemas"]["Package"];
type RawPackageMedia = components["schemas"]["PackageMedia"];

function buildRawWebstore(overrides: Partial<RawWebstore> = {}): RawWebstore {
  return {
    id: 1,
    name: "Test Store",
    description: "A store for testing",
    logo: "https://example.com/logo.png",
    currency: "EUR",
    lang: "en",
    disabled: false,
    platform_type: "Minecraft: Java Edition",
    supports_usernames: true,
    supports_gifting: true,
    ...overrides,
  };
}

function buildRawPackage(overrides: Partial<RawPackage> = {}): RawPackage {
  return {
    id: 100,
    name: "VIP Rank",
    description: "Grants VIP perks",
    image: "https://example.com/package.png",
    type: "subscription",
    base_price: 10,
    discount: 2,
    total_price: 8,
    expiration_date: "2026-12-31T00:00:00+00:00",
    category: { id: 10, name: "Ranks" },
    media: [
      { type: "image", url: "https://example.com/media-1.png", primary: true },
    ],
    ...overrides,
  };
}

function buildRawCategory(overrides: Partial<RawCategory> = {}): RawCategory {
  return {
    id: 10,
    name: "Ranks",
    description: "Server ranks",
    image_url: "https://example.com/category.png",
    display_type: "list",
    packages: [],
    ...overrides,
  };
}

describe("mapWebstore", () => {
  it("maps every field from a typical response", () => {
    const result = mapWebstore(buildRawWebstore());

    expect(result).toEqual({
      id: 1,
      name: "Test Store",
      description: "A store for testing",
      logo: "https://example.com/logo.png",
      currency: "EUR",
      lang: "en",
      disabled: false,
      platform_type: "Minecraft: Java Edition",
      supports_usernames: true,
      supports_gifting: true,
    });
  });

  it("maps a disabled store's flag through as true", () => {
    const result = mapWebstore(buildRawWebstore({ disabled: true }));

    expect(result.disabled).toBe(true);
  });

  it("falls back to documented defaults when optional fields are missing", () => {
    const result = mapWebstore({});

    expect(result).toEqual({
      id: 0,
      name: "",
      description: "",
      logo: null,
      currency: "USD",
      lang: "en",
      disabled: false,
      platform_type: "",
      supports_usernames: false,
      supports_gifting: false,
    });
  });

  it("maps logo: null through as null rather than defaulting", () => {
    const result = mapWebstore(buildRawWebstore({ logo: null }));

    expect(result.logo).toBeNull();
  });
});

describe("mapPackage", () => {
  it("maps every field from a typical response", () => {
    const result = mapPackage(buildRawPackage());

    expect(result).toEqual({
      id: 100,
      name: "VIP Rank",
      description: "Grants VIP perks",
      image: "https://example.com/package.png",
      media: [
        {
          type: "image",
          url: "https://example.com/media-1.png",
          primary: true,
        },
      ],
      type: "subscription",
      base_price: 10,
      discount: 2,
      total_price: 8,
      expiration_date: "2026-12-31T00:00:00+00:00",
      category: { id: 10, name: "Ranks" },
    });
  });

  it("maps a legitimately-zero price and discount through unchanged", () => {
    const result = mapPackage(
      buildRawPackage({ base_price: 0, discount: 0, total_price: 0 }),
    );

    expect(result.base_price).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.total_price).toBe(0);
  });

  describe("normalizing an unrecognized package type", () => {
    it('maps "something-new" to "single"', () => {
      const result = mapPackage(
        buildRawPackage({ type: "something-new" as RawPackage["type"] }),
      );

      expect(result.type).toBe("single");
    });

    it('maps a missing type to "single"', () => {
      const result = mapPackage(buildRawPackage({ type: undefined }));

      expect(result.type).toBe("single");
    });

    it('preserves "subscription" when explicitly set', () => {
      const result = mapPackage(buildRawPackage({ type: "subscription" }));

      expect(result.type).toBe("subscription");
    });
  });

  it("maps a null description to an empty string", () => {
    const result = mapPackage(
      buildRawPackage({ description: null as unknown as string }),
    );

    expect(result.description).toBe("");
  });

  it("maps a null image to null", () => {
    const result = mapPackage(buildRawPackage({ image: null }));

    expect(result.image).toBeNull();
  });

  it("maps a missing expiration_date to null", () => {
    const result = mapPackage(buildRawPackage({ expiration_date: undefined }));

    expect(result.expiration_date).toBeNull();
  });

  it("maps an explicit null expiration_date to null", () => {
    const result = mapPackage(buildRawPackage({ expiration_date: null }));

    expect(result.expiration_date).toBeNull();
  });

  it("maps missing media to an empty array without throwing", () => {
    const result = mapPackage(buildRawPackage({ media: undefined }));

    expect(result.media).toEqual([]);
  });

  it("maps empty media to an empty array", () => {
    const result = mapPackage(buildRawPackage({ media: [] }));

    expect(result.media).toEqual([]);
  });

  it("drops media items with no url", () => {
    const media: RawPackageMedia[] = [
      { type: "image", url: "https://example.com/keep.png" },
      { type: "image" }, // no url — should be dropped
    ];

    const result = mapPackage(buildRawPackage({ media }));

    expect(result.media).toEqual([
      { type: "image", url: "https://example.com/keep.png", primary: false },
    ]);
  });

  it('defaults a media item\'s type to "image" and primary to false when missing', () => {
    const media: RawPackageMedia[] = [{ url: "https://example.com/x.png" }];

    const result = mapPackage(buildRawPackage({ media }));

    expect(result.media).toEqual([
      { type: "image", url: "https://example.com/x.png", primary: false },
    ]);
  });

  it("maps a missing category to the zero-value BaseItem default", () => {
    const result = mapPackage(buildRawPackage({ category: undefined }));

    expect(result.category).toEqual({ id: 0, name: "" });
  });

  it("maps a partial category (missing name) to the documented default", () => {
    const result = mapPackage(
      buildRawPackage({ category: { id: 10 } as RawPackage["category"] }),
    );

    expect(result.category).toEqual({ id: 10, name: "" });
  });
});

describe("mapCategory", () => {
  it("maps every field from a typical response", () => {
    const result = mapCategory(buildRawCategory());

    expect(result).toEqual({
      id: 10,
      name: "Ranks",
      description: "Server ranks",
      image_url: "https://example.com/category.png",
      display_type: "list",
      packages: [],
    });
  });

  describe("normalizing an unrecognized display_type", () => {
    it('maps "whatever" to "grid"', () => {
      const result = mapCategory(
        buildRawCategory({
          display_type: "whatever" as RawCategory["display_type"],
        }),
      );

      expect(result.display_type).toBe("grid");
    });

    it('maps a missing display_type to "grid"', () => {
      const result = mapCategory(buildRawCategory({ display_type: undefined }));

      expect(result.display_type).toBe("grid");
    });

    it('preserves "grid" when explicitly set', () => {
      const result = mapCategory(buildRawCategory({ display_type: "grid" }));

      expect(result.display_type).toBe("grid");
    });
  });

  it("maps a null image_url to null", () => {
    const result = mapCategory(buildRawCategory({ image_url: null }));

    expect(result.image_url).toBeNull();
  });

  it("maps missing packages to an empty array without throwing", () => {
    const result = mapCategory(buildRawCategory({ packages: undefined }));

    expect(result.packages).toEqual([]);
  });

  it("maps a null packages field to an empty array without throwing", () => {
    const result = mapCategory(buildRawCategory({ packages: null }));

    expect(result.packages).toEqual([]);
  });

  it("maps nested packages, including each package's own nested category", () => {
    const result = mapCategory(
      buildRawCategory({
        packages: [
          buildRawPackage({
            id: 99,
            name: "Elite Rank",
            category: { id: 10, name: "Ranks" },
          }),
        ],
      }),
    );

    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toMatchObject({
      id: 99,
      name: "Elite Rank",
      category: { id: 10, name: "Ranks" },
    });
  });
});
