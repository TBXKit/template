/**
 * App-facing domain types. These describe what this storefront needs, not
 * what Tebex's API exposes — they are NOT a mirror of the generated OpenAPI
 * schema (`./generated/schema`), which describes every field Tebex's
 * Headless API can return across baskets, coupons, gift cards, tiers, and
 * more. Fields with no current storefront use (creator metadata, package
 * variables/options, tier/upgrade pricing, dynamic-package internals, basket
 * fields, etc.) are intentionally omitted; add them here only when a feature
 * actually needs them.
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
  /** True if the store supports linking a player username to a basket (needed for tiered categories/gifting). */
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
}

export type CategoryDisplayType = "list" | "grid";

export interface Category extends BaseItem {
  description: string;
  packages: Package[];
  image_url: string | null;
  /** Owner-configured presentation, set in the Tebex dashboard. Anything other than "list" is treated as "grid". */
  display_type: CategoryDisplayType;
}
