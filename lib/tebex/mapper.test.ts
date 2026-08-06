import { describe, expect, it } from "vitest";
import type { components } from "./generated/schema";
import {
  mapAuthProviders,
  mapBasket,
  mapCategory,
  mapPackage,
  mapWebstore,
} from "./mapper";
import type { Basket, Category, Package, Webstore } from "./types";

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
type RawBasket = components["schemas"]["Basket"];
type RawBasketPackage = components["schemas"]["BasketPackage"];

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
    // The generated schema types `variables` as `unknown[]` — no shape is
    // declared, so this fixture (and every variable-shape assumption in
    // mapper.ts) is a best-corroborated guess, not confirmed against a real
    // API response. See mapper.ts's `mapPackageVariables` doc comment.
    variables: [
      {
        identifier: "colour",
        type: "dropdown",
        options: [
          { name: "Red", value: "red" },
          { name: "Blue", value: "blue" },
        ],
      },
    ],
    disable_quantity: false,
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

function buildRawBasketPackage(
  overrides: Partial<RawBasketPackage> = {},
): RawBasketPackage {
  return {
    id: 100,
    name: "VIP Rank",
    image: "https://example.com/package.png",
    in_basket: { quantity: 2, price: 16 },
    ...overrides,
  };
}

// The generated schema types `id` as a string, but a live store returns it as
// a JSON number (see mapper.ts) — the fixture mirrors real behavior, not the
// (incorrect) declared type, hence the cast.
function buildRawBasket(overrides: Partial<RawBasket> = {}): RawBasket {
  return {
    id: 827988340 as unknown as string,
    ident: "1a-55fff4107740a1f40d844ff89607557f45bfafb3",
    complete: false,
    base_price: 10,
    total_price: 8,
    currency: "EUR",
    packages: [buildRawBasketPackage()],
    coupons: [{ code: "SAVE10" }],
    giftcards: [{ card_number: "0127 0244 7210 1111" }],
    creator_code: "some-creator",
    username: "Notch",
    ...overrides,
  };
}

// --- adversarial-test helpers ---------------------------------------------

function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item);
    return Object.freeze(value) as T;
  }
  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    return Object.freeze(value) as T;
  }
  return value;
}

function assertBaseItemInvariants(item: unknown): void {
  expect(typeof item).toBe("object");
  expect(item).not.toBeNull();
  const base = item as Record<string, unknown>;
  expect(typeof base.id).toBe("number");
  expect(Number.isFinite(base.id as number)).toBe(true);
  expect(typeof base.name).toBe("string");
}

function assertPackageInvariants(pkg: Package): void {
  expect(typeof pkg.id).toBe("number");
  expect(Number.isFinite(pkg.id)).toBe(true);
  expect(typeof pkg.name).toBe("string");
  expect(typeof pkg.description).toBe("string");
  expect(pkg.image === null || typeof pkg.image === "string").toBe(true);
  expect(Array.isArray(pkg.media)).toBe(true);
  for (const media of pkg.media) {
    expect(["image", "video"]).toContain(media.type);
    expect(typeof media.url).toBe("string");
    expect(typeof media.primary).toBe("boolean");
  }
  expect(["single", "subscription"]).toContain(pkg.type);
  expect(typeof pkg.base_price).toBe("number");
  expect(Number.isFinite(pkg.base_price)).toBe(true);
  expect(typeof pkg.discount).toBe("number");
  expect(Number.isFinite(pkg.discount)).toBe(true);
  expect(typeof pkg.total_price).toBe("number");
  expect(Number.isFinite(pkg.total_price)).toBe(true);
  expect(
    pkg.expiration_date === null || typeof pkg.expiration_date === "string",
  ).toBe(true);
  assertBaseItemInvariants(pkg.category);
  expect(typeof pkg.disable_quantity).toBe("boolean");
  expect(Array.isArray(pkg.variables)).toBe(true);
  for (const variable of pkg.variables) {
    expect(typeof variable.identifier).toBe("string");
    expect(variable.identifier.length).toBeGreaterThan(0);
    expect([
      "dropdown",
      "text",
      "numeric",
      "alpha",
      "alphanumeric",
      "username",
      "email",
    ]).toContain(variable.type);
    expect(Array.isArray(variable.options)).toBe(true);
    for (const option of variable.options) {
      expect(typeof option.name).toBe("string");
      expect(typeof option.value).toBe("string");
    }
    if (variable.type !== "dropdown") {
      expect(variable.options).toEqual([]);
    }
  }
}

function assertCategoryInvariants(category: Category): void {
  expect(typeof category.id).toBe("number");
  expect(Number.isFinite(category.id)).toBe(true);
  expect(typeof category.name).toBe("string");
  expect(typeof category.description).toBe("string");
  expect(
    category.image_url === null || typeof category.image_url === "string",
  ).toBe(true);
  expect(["grid", "list"]).toContain(category.display_type);
  expect(Array.isArray(category.packages)).toBe(true);
  for (const pkg of category.packages) {
    assertPackageInvariants(pkg);
  }
}

function assertBasketInvariants(basket: Basket): void {
  expect(typeof basket.id).toBe("number");
  expect(Number.isFinite(basket.id)).toBe(true);
  expect(typeof basket.ident).toBe("string");
  expect(typeof basket.complete).toBe("boolean");
  expect(typeof basket.base_price).toBe("number");
  expect(Number.isFinite(basket.base_price)).toBe(true);
  expect(typeof basket.total_price).toBe("number");
  expect(Number.isFinite(basket.total_price)).toBe(true);
  expect(typeof basket.currency).toBe("string");
  expect(
    basket.creator_code === null || typeof basket.creator_code === "string",
  ).toBe(true);
  expect(Array.isArray(basket.packages)).toBe(true);
  for (const pkg of basket.packages) {
    expect(typeof pkg.id).toBe("number");
    expect(Number.isFinite(pkg.id)).toBe(true);
    expect(typeof pkg.name).toBe("string");
    expect(pkg.image === null || typeof pkg.image === "string").toBe(true);
    expect(typeof pkg.quantity).toBe("number");
    expect(Number.isFinite(pkg.quantity)).toBe(true);
    expect(typeof pkg.price).toBe("number");
    expect(Number.isFinite(pkg.price)).toBe(true);
  }
  expect(Array.isArray(basket.coupons)).toBe(true);
  for (const coupon of basket.coupons) {
    expect(typeof coupon.code).toBe("string");
  }
  expect(Array.isArray(basket.giftcards)).toBe(true);
  for (const giftcard of basket.giftcards) {
    expect(typeof giftcard.card_number).toBe("string");
  }
  expect(basket.username === null || typeof basket.username === "string").toBe(
    true,
  );
}

function assertWebstoreInvariants(webstore: Webstore): void {
  expect(typeof webstore.id).toBe("number");
  expect(Number.isFinite(webstore.id)).toBe(true);
  expect(typeof webstore.name).toBe("string");
  expect(typeof webstore.description).toBe("string");
  expect(webstore.logo === null || typeof webstore.logo === "string").toBe(
    true,
  );
  expect(typeof webstore.currency).toBe("string");
  expect(typeof webstore.lang).toBe("string");
  expect(typeof webstore.disabled).toBe("boolean");
  expect(typeof webstore.platform_type).toBe("string");
  expect(typeof webstore.supports_usernames).toBe("boolean");
  expect(typeof webstore.supports_gifting).toBe("boolean");
}

// Deliberately not exhaustive — just a spread of shapes a genuinely broken
// API response could plausibly send in place of a well-formed value.
const CORRUPTIONS: unknown[] = [
  undefined,
  null,
  42,
  -1,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  "unexpected-string",
  "",
  true,
  false,
  [],
  {},
  ["nested", "array"],
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Randomly replaces ~40% of a fixture's top-level fields with garbage. */
function corrupt(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...input };
  for (const key of Object.keys(result)) {
    if (Math.random() < 0.4) {
      result[key] = pick(CORRUPTIONS);
    }
  }
  return result;
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
      variables: [
        {
          identifier: "colour",
          type: "dropdown",
          options: [
            { name: "Red", value: "red" },
            { name: "Blue", value: "blue" },
          ],
        },
      ],
      disable_quantity: false,
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

  it("maps a disable_quantity flag through as true", () => {
    const result = mapPackage(buildRawPackage({ disable_quantity: true }));

    expect(result.disable_quantity).toBe(true);
  });

  it("maps a missing disable_quantity to false", () => {
    const result = mapPackage(buildRawPackage({ disable_quantity: undefined }));

    expect(result.disable_quantity).toBe(false);
  });

  describe("variables", () => {
    it("maps missing variables to an empty array without throwing", () => {
      const result = mapPackage(buildRawPackage({ variables: undefined }));

      expect(result.variables).toEqual([]);
    });

    it("maps empty variables to an empty array", () => {
      const result = mapPackage(buildRawPackage({ variables: [] }));

      expect(result.variables).toEqual([]);
    });

    it("drops a variable entry with no identifier", () => {
      const variables = [
        { identifier: "colour", type: "text" },
        { type: "text" }, // no identifier — should be dropped
      ];

      const result = mapPackage(
        buildRawPackage({ variables: variables as RawPackage["variables"] }),
      );

      expect(result.variables).toEqual([
        { identifier: "colour", type: "text", options: [] },
      ]);
    });

    it("drops null and primitive entries within variables instead of crashing", () => {
      const variables = [
        { identifier: "colour", type: "text" },
        null,
        42,
        "not a variable",
        true,
      ];

      const result = mapPackage(
        buildRawPackage({ variables: variables as RawPackage["variables"] }),
      );

      expect(result.variables).toEqual([
        { identifier: "colour", type: "text", options: [] },
      ]);
    });

    it('defaults an unrecognized type to "text" rather than dropping the entry', () => {
      const variables = [{ identifier: "colour", type: "not-a-real-type" }];

      const result = mapPackage(
        buildRawPackage({ variables: variables as RawPackage["variables"] }),
      );

      expect(result.variables).toEqual([
        { identifier: "colour", type: "text", options: [] },
      ]);
    });

    it('defaults a missing type to "text"', () => {
      const variables = [{ identifier: "colour" }];

      const result = mapPackage(
        buildRawPackage({ variables: variables as RawPackage["variables"] }),
      );

      expect(result.variables).toEqual([
        { identifier: "colour", type: "text", options: [] },
      ]);
    });

    it("preserves every documented variable type", () => {
      const types = [
        "dropdown",
        "text",
        "numeric",
        "alpha",
        "alphanumeric",
        "username",
        "email",
      ];
      const variables = types.map((type) => ({ identifier: type, type }));

      const result = mapPackage(
        buildRawPackage({ variables: variables as RawPackage["variables"] }),
      );

      expect(result.variables.map((v) => v.type)).toEqual(types);
    });

    it("populates options only for a dropdown variable", () => {
      const variables = [
        {
          identifier: "colour",
          type: "dropdown",
          options: [{ name: "Red", value: "red" }],
        },
        {
          identifier: "username",
          type: "username",
          options: [{ name: "Red", value: "red" }], // ignored — not a dropdown
        },
      ];

      const result = mapPackage(
        buildRawPackage({ variables: variables as RawPackage["variables"] }),
      );

      expect(result.variables).toEqual([
        {
          identifier: "colour",
          type: "dropdown",
          options: [{ name: "Red", value: "red" }],
        },
        { identifier: "username", type: "username", options: [] },
      ]);
    });

    it("drops a dropdown option with no value", () => {
      const variables = [
        {
          identifier: "colour",
          type: "dropdown",
          options: [{ name: "Red", value: "red" }, { name: "No value" }],
        },
      ];

      const result = mapPackage(
        buildRawPackage({ variables: variables as RawPackage["variables"] }),
      );

      expect(result.variables[0].options).toEqual([
        { name: "Red", value: "red" },
      ]);
    });

    it("defaults a dropdown option's missing name to its value", () => {
      const variables = [
        {
          identifier: "colour",
          type: "dropdown",
          options: [{ value: "red" }],
        },
      ];

      const result = mapPackage(
        buildRawPackage({ variables: variables as RawPackage["variables"] }),
      );

      expect(result.variables[0].options).toEqual([
        { name: "red", value: "red" },
      ]);
    });

    it("falls back to an empty array for a malformed (non-array) variables field", () => {
      for (const malformed of ["a string", 42, {}, true]) {
        const result = mapPackage(
          buildRawPackage({
            variables: malformed as unknown as RawPackage["variables"],
          }),
        );

        expect(result.variables).toEqual([]);
      }
    });
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

describe("mapBasket", () => {
  it("maps every field from a typical response, flattening in_basket onto each package", () => {
    const result = mapBasket(buildRawBasket());

    expect(result).toEqual({
      id: 827988340,
      ident: "1a-55fff4107740a1f40d844ff89607557f45bfafb3",
      complete: false,
      base_price: 10,
      total_price: 8,
      currency: "EUR",
      packages: [
        {
          id: 100,
          name: "VIP Rank",
          image: "https://example.com/package.png",
          quantity: 2,
          price: 16,
        },
      ],
      coupons: [{ code: "SAVE10" }],
      giftcards: [{ card_number: "0127 0244 7210 1111" }],
      creator_code: "some-creator",
      username: "Notch",
    });
  });

  it("falls back to documented defaults when optional fields are missing", () => {
    const result = mapBasket({});

    expect(result).toEqual({
      id: 0,
      ident: "",
      complete: false,
      base_price: 0,
      total_price: 0,
      currency: "USD",
      packages: [],
      coupons: [],
      giftcards: [],
      creator_code: null,
      username: null,
    });
  });

  it("maps a missing creator_code to null", () => {
    const result = mapBasket(buildRawBasket({ creator_code: undefined }));

    expect(result.creator_code).toBeNull();
  });

  it("maps a missing username to null (anonymous/not-yet-authorized basket)", () => {
    const result = mapBasket(buildRawBasket({ username: undefined }));

    expect(result.username).toBeNull();
  });

  it("maps a non-string username to null instead of crashing", () => {
    const result = mapBasket(
      buildRawBasket({ username: 42 as unknown as string }),
    );

    expect(result.username).toBeNull();
  });

  it("maps a completed basket's flag through as true", () => {
    const result = mapBasket(buildRawBasket({ complete: true }));

    expect(result.complete).toBe(true);
  });

  it("maps a package with a missing in_basket to zero-value quantity/price", () => {
    const result = mapBasket(
      buildRawBasket({
        packages: [buildRawBasketPackage({ in_basket: undefined })],
      }),
    );

    expect(result.packages[0]).toMatchObject({ quantity: 0, price: 0 });
  });
});

describe("mapBasket — adversarial input", () => {
  it("drops a null entry in packages/coupons/giftcards instead of crashing the whole basket", () => {
    const result = mapBasket(
      buildRawBasket({
        packages: [buildRawBasketPackage(), null] as RawBasket["packages"],
        coupons: [{ code: "KEEP" }, null] as RawBasket["coupons"],
        giftcards: [{ card_number: "KEEP" }, null] as RawBasket["giftcards"],
      }),
    );

    expect(result.packages).toHaveLength(1);
    expect(result.coupons).toEqual([{ code: "KEEP" }]);
    expect(result.giftcards).toEqual([{ card_number: "KEEP" }]);
  });

  it("drops primitive entries in packages/coupons/giftcards instead of crashing", () => {
    const result = mapBasket(
      buildRawBasket({
        packages: [
          42,
          "not a package",
          true,
        ] as unknown as RawBasket["packages"],
        coupons: [42, "not a coupon"] as unknown as RawBasket["coupons"],
        giftcards: [42, "not a giftcard"] as unknown as RawBasket["giftcards"],
      }),
    );

    expect(result.packages).toEqual([]);
    expect(result.coupons).toEqual([]);
    expect(result.giftcards).toEqual([]);
  });

  it("maps an empty-object package/coupon/giftcard entry to a fully-defaulted placeholder rather than dropping it", () => {
    const result = mapBasket(
      buildRawBasket({
        packages: [{}] as RawBasket["packages"],
        coupons: [{}] as RawBasket["coupons"],
        giftcards: [{}] as RawBasket["giftcards"],
      }),
    );

    expect(result.packages).toEqual([
      { id: 0, name: "", image: null, quantity: 0, price: 0 },
    ]);
    expect(result.coupons).toEqual([{ code: "" }]);
    expect(result.giftcards).toEqual([{ card_number: "" }]);
  });

  it("falls back to defaults for wrong scalar types instead of passing them through", () => {
    const result = mapBasket({
      id: "not-a-number",
      complete: "yes",
      base_price: "9.99",
      total_price: Number.NaN,
      currency: 840,
    } as unknown as RawBasket);

    expect(result.id).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.base_price).toBe(0);
    expect(result.total_price).toBe(0);
    expect(result.currency).toBe("USD");
  });

  it("ignores unknown extra properties instead of leaking them onto the domain object", () => {
    const result = mapBasket({
      ...buildRawBasket(),
      unexpected_field: "should not appear",
    } as RawBasket);

    expect(result).not.toHaveProperty("unexpected_field");
  });

  it("does not throw when called with a frozen input object, including frozen nested packages", () => {
    const raw = deepFreeze(buildRawBasket());

    expect(() => mapBasket(raw)).not.toThrow();
  });

  it("never mutates its input", () => {
    const raw = buildRawBasket();
    const snapshot = JSON.parse(JSON.stringify(raw));

    mapBasket(raw);

    expect(raw).toEqual(snapshot);
  });

  it("is deterministic across repeated calls with the same object", () => {
    const raw = buildRawBasket();

    expect(mapBasket(raw)).toEqual(mapBasket(raw));
  });

  it("returns a fully-defaulted Basket when called with null, undefined, or a primitive", () => {
    for (const garbage of [null, undefined, 42, "not an object", []]) {
      expect(() => mapBasket(garbage as unknown as RawBasket)).not.toThrow();
      assertBasketInvariants(mapBasket(garbage as unknown as RawBasket));
    }
  });
});

describe("mapAuthProviders", () => {
  it("maps a well-formed provider list", () => {
    const result = mapAuthProviders([
      { name: "Steam", url: "https://ident.tebex.io/steam" },
      { name: "FiveM", url: "https://ident.tebex.io/fivem" },
    ]);

    expect(result).toEqual([
      { name: "Steam", url: "https://ident.tebex.io/steam" },
      { name: "FiveM", url: "https://ident.tebex.io/fivem" },
    ]);
  });

  it("unwraps the extra array layer the live API adds beyond the documented shape", () => {
    // Confirmed against a live store: an empty response is `[[]]`, not `[]`.
    expect(mapAuthProviders([[]])).toEqual([]);

    expect(
      mapAuthProviders([
        [{ name: "Steam", url: "https://ident.tebex.io/steam" }],
      ]),
    ).toEqual([{ name: "Steam", url: "https://ident.tebex.io/steam" }]);
  });

  it("still handles the documented (non-double-wrapped) shape", () => {
    expect(
      mapAuthProviders([
        { name: "Steam", url: "https://ident.tebex.io/steam" },
      ]),
    ).toEqual([{ name: "Steam", url: "https://ident.tebex.io/steam" }]);
  });

  it("drops entries missing a name or url instead of crashing", () => {
    const result = mapAuthProviders([
      { name: "Steam", url: "https://ident.tebex.io/steam" },
      { name: "", url: "https://ident.tebex.io/blank-name" },
      { name: "No URL" },
      null,
      42,
    ]);

    expect(result).toEqual([
      { name: "Steam", url: "https://ident.tebex.io/steam" },
    ]);
  });

  it("returns an empty array for null, undefined, or a non-array input instead of throwing", () => {
    for (const garbage of [null, undefined, 42, "not an array", {}]) {
      expect(() => mapAuthProviders(garbage)).not.toThrow();
      expect(mapAuthProviders(garbage)).toEqual([]);
    }
  });
});

describe("mapWebstore — adversarial input", () => {
  it("maps every optional field explicitly null without throwing", () => {
    expect(() =>
      mapWebstore({
        id: null as unknown as number,
        name: null as unknown as string,
        description: null as unknown as string,
        logo: null,
        currency: null as unknown as string,
        lang: null as unknown as string,
        disabled: null as unknown as boolean,
        platform_type: null as unknown as string,
      }),
    ).not.toThrow();
  });

  it("falls back to defaults for wrong scalar types instead of passing them through", () => {
    const result = mapWebstore({
      id: "not-a-number" as unknown as number,
      disabled: "yes" as unknown as boolean,
      currency: 840 as unknown as string, // ISO 4217 numeric code, wrong shape
      lang: true as unknown as string,
    } as unknown as RawWebstore);

    expect(result.id).toBe(0);
    expect(result.disabled).toBe(false);
    expect(result.currency).toBe("USD");
    expect(result.lang).toBe("en");
  });

  it("keeps empty strings as empty strings rather than substituting a default", () => {
    const result = mapWebstore(
      buildRawWebstore({ name: "", description: "", platform_type: "" }),
    );

    expect(result.name).toBe("");
    expect(result.description).toBe("");
    expect(result.platform_type).toBe("");
  });

  it("handles an excessively long description without truncating or throwing", () => {
    const longDescription = "A".repeat(50_000);

    const result = mapWebstore(
      buildRawWebstore({ description: longDescription }),
    );

    expect(result.description).toBe(longDescription);
    expect(result.description).toHaveLength(50_000);
  });

  it("ignores unknown extra properties instead of leaking them onto the domain object", () => {
    const result = mapWebstore({
      ...buildRawWebstore(),
      unexpected_field: "should not appear",
    } as RawWebstore);

    expect(result).not.toHaveProperty("unexpected_field");
  });

  it("does not throw when called with a frozen input object", () => {
    const raw = deepFreeze(buildRawWebstore());

    expect(() => mapWebstore(raw)).not.toThrow();
  });

  it("never mutates its input", () => {
    const raw = buildRawWebstore();
    const snapshot = JSON.parse(JSON.stringify(raw));

    mapWebstore(raw);

    expect(raw).toEqual(snapshot);
  });

  it("is deterministic across repeated calls with the same object", () => {
    const raw = buildRawWebstore();

    expect(mapWebstore(raw)).toEqual(mapWebstore(raw));
  });

  it("returns a fully-defaulted Webstore when called with null, undefined, or a primitive", () => {
    for (const garbage of [null, undefined, 42, "not an object", []]) {
      expect(() =>
        mapWebstore(garbage as unknown as RawWebstore),
      ).not.toThrow();
      assertWebstoreInvariants(mapWebstore(garbage as unknown as RawWebstore));
    }
  });
});

describe("mapCategory — adversarial and malformed nested data", () => {
  it("drops a null entry in packages instead of crashing the whole category", () => {
    const result = mapCategory(
      buildRawCategory({
        packages: [
          buildRawPackage({ id: 1 }),
          null,
          buildRawPackage({ id: 2 }),
        ] as RawCategory["packages"],
      }),
    );

    expect(result.packages.map((pkg) => pkg.id)).toEqual([1, 2]);
  });

  it("drops primitive entries in packages instead of crashing", () => {
    const result = mapCategory(
      buildRawCategory({
        packages: [
          buildRawPackage({ id: 1 }),
          42,
          "not a package",
          true,
        ] as unknown as RawCategory["packages"],
      }),
    );

    expect(result.packages.map((pkg) => pkg.id)).toEqual([1]);
  });

  it("maps an empty-object package entry to a fully-defaulted placeholder rather than dropping it", () => {
    const result = mapCategory(
      buildRawCategory({ packages: [{}] as RawCategory["packages"] }),
    );

    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toMatchObject({ id: 0, name: "" });
  });

  it.each([
    ["a number", 42],
    ["an object", { foo: "bar" }],
    ["null", null],
    ["an array", ["list"]],
  ])('normalizes display_type of %s to "grid"', (_label, value) => {
    const result = mapCategory(
      buildRawCategory({
        display_type: value as unknown as RawCategory["display_type"],
      }),
    );

    expect(result.display_type).toBe("grid");
  });

  it("keeps duplicate packages rather than silently deduplicating them", () => {
    const duplicate = buildRawPackage({ id: 5, name: "Duplicate" });

    const result = mapCategory(
      buildRawCategory({ packages: [duplicate, duplicate] }),
    );

    expect(result.packages).toHaveLength(2);
    expect(result.packages[0]).toEqual(result.packages[1]);
  });

  it("falls back to defaults for a missing id and name", () => {
    const result = mapCategory(
      buildRawCategory({ id: undefined, name: undefined }),
    );

    expect(result.id).toBe(0);
    expect(result.name).toBe("");
  });

  it("ignores unknown extra properties", () => {
    const result = mapCategory({
      ...buildRawCategory(),
      unexpected_field: "should not appear",
    } as RawCategory);

    expect(result).not.toHaveProperty("unexpected_field");
  });

  it("does not throw when called with a frozen input object, including frozen nested packages", () => {
    const raw = deepFreeze(buildRawCategory({ packages: [buildRawPackage()] }));

    expect(() => mapCategory(raw)).not.toThrow();
  });

  it("never mutates its input, including nested package objects", () => {
    const raw = buildRawCategory({ packages: [buildRawPackage()] });
    const snapshot = JSON.parse(JSON.stringify(raw));

    mapCategory(raw);

    expect(raw).toEqual(snapshot);
  });

  it("is deterministic across repeated calls with the same object", () => {
    const raw = buildRawCategory({ packages: [buildRawPackage()] });

    expect(mapCategory(raw)).toEqual(mapCategory(raw));
  });

  it("returns a fully-defaulted Category when called with null, undefined, or a primitive", () => {
    for (const garbage of [null, undefined, 42, "not an object", []]) {
      expect(() =>
        mapCategory(garbage as unknown as RawCategory),
      ).not.toThrow();
      assertCategoryInvariants(mapCategory(garbage as unknown as RawCategory));
    }
  });
});

describe("mapPackage — adversarial input", () => {
  it("falls back to the default category for a malformed (non-object) category", () => {
    for (const malformed of ["a string", 42, true, ["array"]]) {
      const result = mapPackage(
        buildRawPackage({
          category: malformed as unknown as RawPackage["category"],
        }),
      );

      expect(result.category).toEqual({ id: 0, name: "" });
    }
  });

  it("falls back to an empty media array for a malformed (non-array) media field", () => {
    for (const malformed of ["a string", 42, {}, true]) {
      const result = mapPackage(
        buildRawPackage({ media: malformed as unknown as RawPackage["media"] }),
      );

      expect(result.media).toEqual([]);
    }
  });

  it("drops null and primitive entries within media instead of crashing", () => {
    const media = [
      { type: "image", url: "https://example.com/keep.png" },
      null,
      42,
      "not media",
      true,
    ] as unknown as RawPackageMedia[];

    const result = mapPackage(buildRawPackage({ media }));

    expect(result.media).toEqual([
      { type: "image", url: "https://example.com/keep.png", primary: false },
    ]);
  });

  it("drops a media item whose url is not a string", () => {
    const media = [
      { type: "image", url: 12345 },
    ] as unknown as RawPackageMedia[];

    const result = mapPackage(buildRawPackage({ media }));

    expect(result.media).toEqual([]);
  });

  it("does not coerce numeric strings for price/id fields — treats them as invalid", () => {
    const result = mapPackage(
      buildRawPackage({
        id: "100" as unknown as number,
        base_price: "9.99" as unknown as number,
        discount: "2" as unknown as number,
        total_price: "7.99" as unknown as number,
      }),
    );

    expect(result.id).toBe(0);
    expect(result.base_price).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.total_price).toBe(0);
  });

  it("rejects NaN price values and falls back to 0", () => {
    const result = mapPackage(
      buildRawPackage({
        base_price: Number.NaN,
        discount: Number.NaN,
        total_price: Number.NaN,
      }),
    );

    expect(result.base_price).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.total_price).toBe(0);
  });

  it("rejects Infinity price values and falls back to 0", () => {
    const result = mapPackage(
      buildRawPackage({
        base_price: Number.POSITIVE_INFINITY,
        total_price: Number.NEGATIVE_INFINITY,
      }),
    );

    expect(result.base_price).toBe(0);
    expect(result.total_price).toBe(0);
  });

  it("passes a negative price through unchanged — the mapper validates shape, not business rules", () => {
    const result = mapPackage(buildRawPackage({ base_price: -5 }));

    expect(result.base_price).toBe(-5);
  });

  it("passes an extremely large price through unchanged", () => {
    const result = mapPackage(buildRawPackage({ base_price: 1e15 }));

    expect(result.base_price).toBe(1e15);
  });

  it("keeps an empty description as an empty string", () => {
    const result = mapPackage(buildRawPackage({ description: "" }));

    expect(result.description).toBe("");
  });

  it("maps a missing image to null", () => {
    const result = mapPackage(buildRawPackage({ image: undefined }));

    expect(result.image).toBeNull();
  });

  it.each([
    ["a number", 20261231],
    ["an object", {}],
    ["an array", []],
  ])("falls back to null for an expiration_date that is %s", (_label, value) => {
    const result = mapPackage(
      buildRawPackage({
        expiration_date: value as unknown as RawPackage["expiration_date"],
      }),
    );

    expect(result.expiration_date).toBeNull();
  });

  it("ignores unknown extra properties", () => {
    const result = mapPackage({
      ...buildRawPackage(),
      unexpected_field: "should not appear",
    } as RawPackage);

    expect(result).not.toHaveProperty("unexpected_field");
  });

  it("does not throw when called with a frozen input object", () => {
    const raw = deepFreeze(buildRawPackage());

    expect(() => mapPackage(raw)).not.toThrow();
  });

  it("never mutates its input", () => {
    const raw = buildRawPackage();
    const snapshot = JSON.parse(JSON.stringify(raw));

    mapPackage(raw);

    expect(raw).toEqual(snapshot);
  });

  it("is deterministic across repeated calls with the same object", () => {
    const raw = buildRawPackage();

    expect(mapPackage(raw)).toEqual(mapPackage(raw));
  });

  it("returns a fully-defaulted Package when called with null, undefined, or a primitive", () => {
    for (const garbage of [null, undefined, 42, "not an object", []]) {
      expect(() => mapPackage(garbage as unknown as RawPackage)).not.toThrow();
      assertPackageInvariants(mapPackage(garbage as unknown as RawPackage));
    }
  });
});

describe("domain invariants under hostile input", () => {
  const hostilePackageFixtures: RawPackage[] = [
    buildRawPackage(),
    buildRawPackage({ type: "something-new" as RawPackage["type"] }),
    buildRawPackage({
      base_price: Number.NaN,
      total_price: Number.POSITIVE_INFINITY,
    }),
    buildRawPackage({
      category: "broken" as unknown as RawPackage["category"],
    }),
    buildRawPackage({ media: "broken" as unknown as RawPackage["media"] }),
    buildRawPackage({
      variables: "broken" as unknown as RawPackage["variables"],
    }),
    buildRawPackage({
      variables: [
        { identifier: "colour", type: "not-a-real-type" },
        null,
        42,
      ] as unknown as RawPackage["variables"],
    }),
    {} as RawPackage,
  ];

  it.each(
    hostilePackageFixtures.map((fixture, index) => [index, fixture]),
  )("mapPackage fixture #%s always satisfies Package invariants", (_index, fixture) => {
    assertPackageInvariants(mapPackage(fixture as RawPackage));
  });

  const hostileCategoryFixtures: RawCategory[] = [
    buildRawCategory(),
    buildRawCategory({
      display_type: "unknown" as RawCategory["display_type"],
    }),
    buildRawCategory({
      packages: [buildRawPackage(), null, 42, {}] as RawCategory["packages"],
    }),
    {} as RawCategory,
  ];

  it.each(
    hostileCategoryFixtures.map((fixture, index) => [index, fixture]),
  )("mapCategory fixture #%s always satisfies Category invariants", (_index, fixture) => {
    assertCategoryInvariants(mapCategory(fixture as RawCategory));
  });

  const hostileWebstoreFixtures: RawWebstore[] = [
    buildRawWebstore(),
    buildRawWebstore({ id: "abc" as unknown as number }),
    {} as RawWebstore,
  ];

  it.each(
    hostileWebstoreFixtures.map((fixture, index) => [index, fixture]),
  )("mapWebstore fixture #%s always satisfies Webstore invariants", (_index, fixture) => {
    assertWebstoreInvariants(mapWebstore(fixture as RawWebstore));
  });

  const hostileBasketFixtures: RawBasket[] = [
    buildRawBasket(),
    buildRawBasket({ id: "abc" as unknown as string }),
    buildRawBasket({
      packages: [
        buildRawBasketPackage(),
        null,
        42,
        {},
      ] as RawBasket["packages"],
    }),
    {} as RawBasket,
  ];

  it.each(
    hostileBasketFixtures.map((fixture, index) => [index, fixture]),
  )("mapBasket fixture #%s always satisfies Basket invariants", (_index, fixture) => {
    assertBasketInvariants(mapBasket(fixture as RawBasket));
  });
});

describe("randomized resilience", () => {
  const ITERATIONS = 200;

  it("mapPackage never throws and always satisfies invariants under random corruption", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const raw = corrupt(
        buildRawPackage() as unknown as Record<string, unknown>,
      );

      let result: Package | undefined;
      expect(() => {
        result = mapPackage(raw);
      }).not.toThrow();
      assertPackageInvariants(result as Package);
    }
  });

  it("mapCategory never throws and always satisfies invariants under random corruption", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const raw = corrupt(
        buildRawCategory() as unknown as Record<string, unknown>,
      );

      let result: Category | undefined;
      expect(() => {
        result = mapCategory(raw);
      }).not.toThrow();
      assertCategoryInvariants(result as Category);
    }
  });

  it("mapWebstore never throws and always satisfies invariants under random corruption", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const raw = corrupt(
        buildRawWebstore() as unknown as Record<string, unknown>,
      );

      let result: Webstore | undefined;
      expect(() => {
        result = mapWebstore(raw);
      }).not.toThrow();
      assertWebstoreInvariants(result as Webstore);
    }
  });

  it("mapBasket never throws and always satisfies invariants under random corruption", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const raw = corrupt(
        buildRawBasket() as unknown as Record<string, unknown>,
      );

      let result: Basket | undefined;
      expect(() => {
        result = mapBasket(raw);
      }).not.toThrow();
      assertBasketInvariants(result as Basket);
    }
  });

  it("corrupts nested packages within a category and still satisfies invariants", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const raw = corrupt(
        buildRawCategory({
          packages: [
            buildRawPackage(),
            corrupt(buildRawPackage() as unknown as Record<string, unknown>),
          ],
        }) as unknown as Record<string, unknown>,
      );

      let result: Category | undefined;
      expect(() => {
        result = mapCategory(raw);
      }).not.toThrow();
      assertCategoryInvariants(result as Category);
    }
  });
});

describe("performance sanity", () => {
  it("maps a category containing 1,000+ packages completely and correctly", () => {
    const PACKAGE_COUNT = 2000;
    const packages = Array.from({ length: PACKAGE_COUNT }, (_, index) =>
      buildRawPackage({ id: index, name: `Package ${index}` }),
    );

    const result = mapCategory(buildRawCategory({ packages }));

    expect(result.packages).toHaveLength(PACKAGE_COUNT);
    expect(result.packages[0]).toMatchObject({ id: 0, name: "Package 0" });
    expect(result.packages[PACKAGE_COUNT - 1]).toMatchObject({
      id: PACKAGE_COUNT - 1,
      name: `Package ${PACKAGE_COUNT - 1}`,
    });
    expect(result.packages.every((pkg) => typeof pkg.id === "number")).toBe(
      true,
    );
  });
});
