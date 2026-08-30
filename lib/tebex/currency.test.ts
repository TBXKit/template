import { describe, expect, it } from "vitest";
import { formatCurrency } from "./currency";

// formatCurrency wraps Intl.NumberFormat with a fixed set of options. These
// tests pin that contract without hardcoding a locale-specific output string
// (the CI/dev locale is whatever the host resolves `undefined` to) — they
// compare against a reference Intl.NumberFormat call the same way
// package-price.test.tsx does.
function reference(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

describe("formatCurrency", () => {
  it("formats using currency style at the host's default locale", () => {
    expect(formatCurrency(19.99, "USD")).toBe(reference(19.99, "USD"));
  });

  it("does not override the currency's own fraction-digit rules", () => {
    // JPY has 0 minor units, BHD has 3 — formatCurrency must not force 2.
    expect(formatCurrency(1000, "JPY")).toBe(reference(1000, "JPY"));
    expect(formatCurrency(12.345, "BHD")).toBe(reference(12.345, "BHD"));
  });

  it("distinguishes currencies", () => {
    expect(formatCurrency(5, "USD")).not.toBe(formatCurrency(5, "EUR"));
  });

  it("rounds to the currency's precision the same way Intl does", () => {
    expect(formatCurrency(1.005, "USD")).toBe(reference(1.005, "USD"));
    expect(formatCurrency(19.999999, "USD")).toBe(reference(19.999999, "USD"));
  });

  it("handles zero, negative, and large values without throwing", () => {
    for (const amount of [0, -10, 987_654_321.5, 1e15]) {
      expect(() => formatCurrency(amount, "USD")).not.toThrow();
      expect(typeof formatCurrency(amount, "USD")).toBe("string");
    }
  });

  it("throws for a currency code that isn't well-formed ISO 4217", () => {
    // Documented limitation, matching PackagePrice: `currency` comes from the
    // store owner's own Tebex config, not visitor input, so there's no
    // fallback for a malformed code.
    expect(() => formatCurrency(10, "NOT-A-CURRENCY")).toThrow();
  });
});
