/**
 * Normalization boundary between Tebex's generated OpenAPI schema
 * (`./generated/schema`) and this app's domain types (`./types`).
 *
 * The generated schema marks every field optional (the spec doesn't declare
 * `required`), so a raw response can't be trusted to have any given field.
 * Each `map*` function here takes a raw generated shape and returns a fully
 * populated domain object, applying a documented default for any field that
 * is missing or doesn't match the expected shape at runtime. `lib/tebex/index.ts`
 * is the only caller of these functions.
 */
import type { components } from "./generated/schema";
import type {
  BaseItem,
  Category,
  CategoryDisplayType,
  Package,
  PackageMedia,
  PackageType,
  Webstore,
} from "./types";

// The generated schema doesn't yet declare `supports_usernames` /
// `supports_gifting` on Webstore, even though the live Headless API returns
// both (confirmed against a real store). Extend locally until
// `npm run generate:tebex-types` picks up a spec that includes them.
type RawWebstore = components["schemas"]["Webstore"] & {
  supports_usernames?: boolean;
  supports_gifting?: boolean;
};

export function mapWebstore(raw: components["schemas"]["Webstore"]): Webstore {
  const extended = raw as RawWebstore;

  return {
    id: raw.id ?? 0,
    name: raw.name ?? "",
    description: raw.description ?? "",
    logo: raw.logo ?? null,
    currency: raw.currency ?? "USD",
    lang: raw.lang ?? "en",
    disabled: raw.disabled ?? false,
    platform_type: raw.platform_type ?? "",
    supports_usernames: extended.supports_usernames ?? false,
    supports_gifting: extended.supports_gifting ?? false,
  };
}

function mapCategoryDisplayType(
  raw: components["schemas"]["Category"]["display_type"],
): CategoryDisplayType {
  // Anything other than an explicit "list" is treated as "grid" — the
  // existing, pre-mapper default — so an unexpected or missing value degrades
  // gracefully instead of breaking category presentation.
  return raw === "list" ? "list" : "grid";
}

export function mapCategory(raw: components["schemas"]["Category"]): Category {
  return {
    id: raw.id ?? 0,
    name: raw.name ?? "",
    description: raw.description ?? "",
    image_url: raw.image_url ?? null,
    display_type: mapCategoryDisplayType(raw.display_type),
    packages: (raw.packages ?? []).map(mapPackage),
  };
}

function mapPackageType(
  raw: components["schemas"]["Package"]["type"],
): PackageType {
  // The generated schema types `type` as a plain `string`, not a
  // `"subscription" | "single"` union, even though those are the only two
  // real values. Anything unrecognized (including missing) defaults to the
  // more common "single" rather than guessing at a third state.
  return raw === "subscription" ? "subscription" : "single";
}

function mapPackageCategory(
  raw: components["schemas"]["Package"]["category"],
): BaseItem {
  return {
    id: raw?.id ?? 0,
    name: raw?.name ?? "",
  };
}

function mapPackageMedia(
  raw: components["schemas"]["PackageMedia"][] | undefined,
): PackageMedia[] {
  return (raw ?? [])
    .filter((item): item is typeof item & { url: string } => Boolean(item.url))
    .map((item) => ({
      type: item.type === "video" ? "video" : "image",
      url: item.url,
      primary: item.primary ?? false,
    }));
}

export function mapPackage(raw: components["schemas"]["Package"]): Package {
  return {
    id: raw.id ?? 0,
    name: raw.name ?? "",
    description: raw.description ?? "",
    image: raw.image ?? null,
    media: mapPackageMedia(raw.media),
    type: mapPackageType(raw.type),
    base_price: raw.base_price ?? 0,
    discount: raw.discount ?? 0,
    total_price: raw.total_price ?? 0,
    expiration_date: raw.expiration_date ?? null,
    category: mapPackageCategory(raw.category),
  };
}
