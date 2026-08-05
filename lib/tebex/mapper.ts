/**
 * Normalization boundary between Tebex's generated OpenAPI schema
 * (`./generated/schema`) and this app's domain types (`./types`).
 *
 * The generated schema marks every field optional (the spec doesn't declare
 * `required`), and — as this project has repeatedly found — doesn't
 * guarantee that a present field has the *type* the spec claims either. Each
 * `map*` function here treats its input as untrusted at runtime regardless of
 * its static type: every field is read defensively and validated by type
 * before use, and anything missing, `null`, or the wrong type falls back to
 * the same documented default a missing field would get. A `map*` function
 * never throws on malformed input — a genuinely broken response degrades to
 * a fully-defaulted domain object rather than crashing the caller.
 * `lib/tebex/index.ts` is the only caller of these functions.
 */
import type {
  BaseItem,
  Category,
  CategoryDisplayType,
  Package,
  PackageMedia,
  PackageType,
  Webstore,
} from "./types";

// --- scalar guards ---------------------------------------------------------
// "Optional" in the generated schema only ever meant "might be missing," not
// "might be missing or might be the wrong type." These guards treat both the
// same way: fall back to the field's documented default.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toRequiredString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

// --- Webstore ----------------------------------------------------------------

// The generated schema doesn't declare `supports_usernames` / `supports_gifting`
// on Webstore even though the live API returns both (confirmed against a real
// store) — read them off the same untyped record rather than typing a second
// generated-schema shape just for two fields.

export function mapWebstore(raw: unknown): Webstore {
  const source = isRecord(raw) ? raw : {};

  return {
    id: toFiniteNumber(source.id, 0),
    name: toRequiredString(source.name, ""),
    description: toRequiredString(source.description, ""),
    logo: toNullableString(source.logo),
    currency: toRequiredString(source.currency, "USD"),
    lang: toRequiredString(source.lang, "en"),
    disabled: toBoolean(source.disabled, false),
    platform_type: toRequiredString(source.platform_type, ""),
    supports_usernames: toBoolean(source.supports_usernames, false),
    supports_gifting: toBoolean(source.supports_gifting, false),
  };
}

// --- Category ----------------------------------------------------------------

function mapCategoryDisplayType(raw: unknown): CategoryDisplayType {
  // Anything other than an explicit "list" is treated as "grid" — the
  // existing, pre-mapper default — so an unexpected or missing value degrades
  // gracefully instead of breaking category presentation.
  return raw === "list" ? "list" : "grid";
}

export function mapCategory(raw: unknown): Category {
  const source = isRecord(raw) ? raw : {};
  const packages = Array.isArray(source.packages) ? source.packages : [];

  return {
    id: toFiniteNumber(source.id, 0),
    name: toRequiredString(source.name, ""),
    description: toRequiredString(source.description, ""),
    image_url: toNullableString(source.image_url),
    display_type: mapCategoryDisplayType(source.display_type),
    // Entries that aren't even plausibly a package (null, a primitive, a
    // nested array) are dropped rather than mapped into a fake placeholder —
    // one malformed entry should never take down the rest of the category.
    // An empty object *is* kept (mapped to a fully-defaulted package),
    // consistent with how a bare `{}` is handled everywhere else here.
    packages: packages.filter(isRecord).map(mapPackage),
  };
}

// --- Package -------------------------------------------------------------

function mapPackageType(raw: unknown): PackageType {
  // The generated schema types `type` as a plain `string`, not a
  // `"subscription" | "single"` union, even though those are the only two
  // real values. Anything unrecognized (including missing) defaults to the
  // more common "single" rather than guessing at a third state.
  return raw === "subscription" ? "subscription" : "single";
}

function mapPackageCategory(raw: unknown): BaseItem {
  const source = isRecord(raw) ? raw : {};
  return {
    id: toFiniteNumber(source.id, 0),
    name: toRequiredString(source.name, ""),
  };
}

function mapPackageMedia(raw: unknown): PackageMedia[] {
  const items = Array.isArray(raw) ? raw : [];

  return items
    .filter(isRecord)
    .filter(
      (item): item is Record<string, unknown> & { url: string } =>
        typeof item.url === "string" && item.url.length > 0,
    )
    .map((item) => ({
      type: item.type === "video" ? "video" : "image",
      url: item.url,
      primary: toBoolean(item.primary, false),
    }));
}

export function mapPackage(raw: unknown): Package {
  const source = isRecord(raw) ? raw : {};

  return {
    id: toFiniteNumber(source.id, 0),
    name: toRequiredString(source.name, ""),
    description: toRequiredString(source.description, ""),
    image: toNullableString(source.image),
    media: mapPackageMedia(source.media),
    type: mapPackageType(source.type),
    base_price: toFiniteNumber(source.base_price, 0),
    discount: toFiniteNumber(source.discount, 0),
    total_price: toFiniteNumber(source.total_price, 0),
    expiration_date: toNullableString(source.expiration_date),
    category: mapPackageCategory(source.category),
  };
}
