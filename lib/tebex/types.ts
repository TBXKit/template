/**
 * App-facing domain types. These describe what this storefront needs, not
 * what Tebex's API exposes — they are NOT a mirror of the generated OpenAPI
 * schema (`./generated/schema`), which describes every field Tebex's
 * Headless API can return across baskets, coupons, gift cards, tiers, and
 * more. Fields with no current storefront use (creator metadata,
 * tier/upgrade pricing, dynamic-package internals, basket fields, etc.) are
 * intentionally omitted; add them here only when a feature actually needs
 * them.
 *
 * `lib/tebex/mapper.ts` is the only place that converts generated schema
 * shapes into these types — it fills in a documented default for any field
 * that's missing or malformed at runtime, since the generated schema marks
 * every field optional. Nothing outside `lib/tebex/` should import from
 * `./generated/schema` directly.
 */
export interface Webstore {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  currency: string;
  lang: string;
  /** True if the store is currently disabled for purchases in the Tebex dashboard. */
  disabled: boolean;
  /** e.g. "Minecraft: Java Edition" */
  platform_type: string;
  /**
   * True if the store links a player username to a basket instead of an
   * external OAuth-style provider redirect. Originally documented here (and
   * in Tebex's own materials) as only "needed for tiered categories/gifting"
   * — confirmed against a live store to actually gate every package add:
   * `POST /baskets/{ident}/packages` 422s with "User must login before
   * adding packages to basket" until the basket was created with a
   * `username`. See `lib/tebex/session.ts` and `app/login/`.
   */
  supports_usernames: boolean;
  /** True if the store has gifting enabled. */
  supports_gifting: boolean;
}

export interface BaseItem {
  id: number;
  name: string;
}

export type PackageType = "subscription" | "single";

export interface PackageMedia {
  type: "image" | "video";
  url: string;
  /** True if this is the package's primary/hero media item. */
  primary: boolean;
}

/**
 * The store owner-configured type list, per Tebex's dashboard docs and the
 * Vue reference client — NOT confirmed against the Headless API itself,
 * which types `Package.variables` as an untyped `unknown[]` and documents no
 * shape for it. Best-corroborated answer available, not a confirmed one; see
 * `mapper.ts`'s `mapPackageVariables`.
 */
export type PackageVariableType =
  | "dropdown"
  | "text"
  | "numeric"
  | "alpha"
  | "alphanumeric"
  | "username"
  | "email";

export interface PackageVariableOption {
  /** Shown to the customer. */
  name: string;
  /** Submitted as this variable's value when this option is selected. */
  value: string;
}

export interface PackageVariable {
  /** The key `variable_data` is submitted under when adding this package to a basket. */
  identifier: string;
  type: PackageVariableType;
  /** Only populated when type is "dropdown"; empty for every other type. */
  options: PackageVariableOption[];
}

export interface Package extends BaseItem {
  description: string;
  image: string | null;
  /** Additional images/video beyond `image`. Not currently rendered by any component. */
  media: PackageMedia[];
  type: PackageType;
  base_price: number;
  /** Amount deducted from base_price to reach total_price; 0 when not on sale. */
  discount: number;
  total_price: number;
  /** ISO 8601 date-time the package stops being available, if the store owner set one. */
  expiration_date: string | null;
  category: BaseItem;
  /** Custom input required at purchase time, configured per package in the Tebex dashboard. Every entry is treated as required. */
  variables: PackageVariable[];
  /** True if this package can only ever be added at quantity 1. */
  disable_quantity: boolean;
}

export interface BasketPackage extends BaseItem {
  image: string | null;
  quantity: number;
  price: number;
}

export interface Coupon {
  code: string;
}

export interface GiftCard {
  card_number: string;
}

export interface Basket {
  /**
   * The generated schema types this as a string, but the live API returns a
   * JSON number (confirmed against a real store) — modeled here as `number`
   * to match actual behavior, the same "trust behavior over the spec" call
   * already made for `Package.type` elsewhere in this file.
   */
  id: number;
  ident: string;
  complete: boolean;
  packages: BasketPackage[];
  coupons: Coupon[];
  giftcards: GiftCard[];
  creator_code: string | null;
  base_price: number;
  total_price: number;
  currency: string;
  /**
   * The player identity linked to this basket, if any — set by passing
   * `username` at basket creation (username-auth stores, confirmed against
   * a live store though undocumented in Tebex's own schema) or by
   * completing the external-provider auth redirect (`getBasketAuthProviders`).
   * There's no endpoint to attach/change this on a basket after creation.
   */
  username: string | null;
}

/**
 * One external identity provider (Steam, FiveM, ...) a visitor can
 * authorize a basket against — returned by `getBasketAuthProviders`. Empty
 * for username-auth stores (`Webstore.supports_usernames`), which use
 * `createBasket(username)` instead of a redirect.
 */
export interface AuthProvider {
  name: string;
  url: string;
}

export type CategoryDisplayType = "list" | "grid";

export interface Category extends BaseItem {
  description: string;
  packages: Package[];
  image_url: string | null;
  /** Owner-configured presentation, set in the Tebex dashboard. Anything other than "list" is treated as "grid". */
  display_type: CategoryDisplayType;
}
