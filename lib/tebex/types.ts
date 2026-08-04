/**
 * App-facing domain types, deliberately kept separate from the generated
 * OpenAPI schema (`./generated/schema`). The generated types mark every
 * field optional (the spec doesn't declare `required`) and, for the two
 * single-item endpoints this app uses, type `data` as an array even though
 * the live API returns a single object — neither is a shape components
 * should be written against. These types describe what the API actually
 * returns and what the UI actually needs; `lib/tebex/index.ts` is the only
 * place that bridges the two.
 */
export interface Webstore {
  id: number;
  name: string;
  description: string;
  currency: string;
  lang: string;
  logo: string | null;
  /** True if the store is currently disabled for purchases in the Tebex dashboard. */
  disabled: boolean;
  /** e.g. "Minecraft: Java Edition" */
  platform_type: string;
}

export interface BaseItem {
  id: number;
  name: string;
}

export type PackageType = "subscription" | "single";

export interface Package extends BaseItem {
  description: string;
  type: PackageType;
  base_price: number;
  total_price: number;
  /** Amount deducted from base_price to reach total_price; 0 when not on sale. */
  discount: number;
  image: string | null;
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
