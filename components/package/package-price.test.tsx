import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PackagePrice } from "./package-price";

// Computes the same real Intl.NumberFormat output the component itself
// produces, so assertions stay correct across locales/OSes without ever
// mocking Intl.NumberFormat or hardcoding a locale-specific string.
function formatExpected(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Some currencies (e.g. BHD, formatted as "BHD 12.345") render with a
// non-breaking space between the code and the amount. RTL's default text
// normalizer collapses that in the DOM's text before comparing, but doesn't
// normalize a plain string matcher the same way — an exact getByText(string)
// can spuriously fail even though the rendered text is correct. Normalizing
// both sides ourselves sidesteps that mismatch entirely.
//
// A custom function matcher loses getByText(string)'s built-in "only match
// the innermost element" behavior, so it's replicated by hand here: only
// match an element whose *own* normalized text equals the target and whose
// children don't already match (otherwise every ancestor up to <body> would
// match too, since textContent aggregates descendants).
function byNormalizedText(expected: string) {
  const target = normalizeWhitespace(expected);
  const hasTargetText = (element: Element) =>
    normalizeWhitespace(element.textContent ?? "") === target;

  return (_content: string, element: Element | null) =>
    element !== null &&
    hasTargetText(element) &&
    Array.from(element.children).every((child) => !hasTargetText(child));
}

// The matcher for "an element showing this formatted price". Always routed
// through byNormalizedText: depending on the host's ICU version,
// Intl.NumberFormat separates the currency symbol from the amount with a
// narrow no-break space (U+202F) or a regular no-break space (U+00A0), and a
// plain getByText(string) doesn't normalize the matcher side the way it
// normalizes the DOM side — so an exact-string match spuriously fails even
// though the rendered text is right. This bit USD once the dev/CI ICU started
// emitting U+202F for the default locale.
function priceMatcher(amount: number, currency = "USD") {
  return byNormalizedText(formatExpected(amount, currency));
}

const defaultProps = {
  basePrice: 10,
  totalPrice: 10,
  discount: 0,
  currency: "USD",
};

describe("PackagePrice — normal rendering", () => {
  it("renders a normal price", () => {
    render(
      <PackagePrice {...defaultProps} basePrice={19.99} totalPrice={19.99} />,
    );

    expect(screen.getByText(priceMatcher(19.99, "USD"))).toBeInTheDocument();
  });

  it("renders zero correctly", () => {
    render(<PackagePrice {...defaultProps} basePrice={0} totalPrice={0} />);

    expect(screen.getByText(priceMatcher(0, "USD"))).toBeInTheDocument();
  });

  it("renders large prices", () => {
    const amount = 987_654_321.5;
    render(
      <PackagePrice {...defaultProps} basePrice={amount} totalPrice={amount} />,
    );

    expect(screen.getByText(priceMatcher(amount, "USD"))).toBeInTheDocument();
  });

  it("renders decimal prices correctly", () => {
    render(<PackagePrice {...defaultProps} basePrice={4.2} totalPrice={4.2} />);

    expect(screen.getByText(priceMatcher(4.2, "USD"))).toBeInTheDocument();
  });

  it("renders without a custom className", () => {
    const { container } = render(<PackagePrice {...defaultProps} />);

    expect((container.firstChild as HTMLElement).className).toBe("");
  });

  it("renders with a custom className", () => {
    const { container } = render(
      <PackagePrice {...defaultProps} className="text-lg font-bold" />,
    );

    expect(container.firstChild).toHaveClass("text-lg", "font-bold");
  });
});

describe("PackagePrice — sale behavior", () => {
  it("does not show a sale when discount is zero", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={8}
        discount={0}
      />,
    );

    expect(screen.queryByText("Sale")).not.toBeInTheDocument();
    expect(screen.getByText(priceMatcher(8, "USD"))).toBeInTheDocument();
  });

  it("does not show a sale when basePrice === totalPrice, even with a positive discount", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={10}
        discount={5}
      />,
    );

    expect(screen.queryByText("Sale")).not.toBeInTheDocument();
  });

  it("does not show a sale when discount > 0 but there is no actual price reduction", () => {
    // A positive discount that doesn't correspond to a real price drop (here,
    // totalPrice is *higher* than basePrice) must never render as a sale.
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={12}
        discount={5}
      />,
    );

    expect(screen.queryByText("Sale")).not.toBeInTheDocument();
    expect(screen.getByText(priceMatcher(12, "USD"))).toBeInTheDocument();
  });

  it("shows a sale when discount > 0 and totalPrice < basePrice", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={8}
        discount={2}
      />,
    );

    expect(screen.getByText("Sale")).toBeInTheDocument();
  });

  it("renders both the original and discounted prices", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={8}
        discount={2}
      />,
    );

    expect(screen.getByText(priceMatcher(10, "USD"))).toBeInTheDocument();
    expect(screen.getByText(priceMatcher(8, "USD"))).toBeInTheDocument();
  });

  it("visually marks the original price as struck-through", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={8}
        discount={2}
      />,
    );

    expect(screen.getByText(priceMatcher(10, "USD"))).toHaveClass(
      "line-through",
    );
  });

  it("does not strike through the discounted price", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={8}
        discount={2}
      />,
    );

    expect(screen.getByText(priceMatcher(8, "USD"))).not.toHaveClass(
      "line-through",
    );
  });
});

describe("PackagePrice — currency handling", () => {
  it.each([
    ["EUR", 19.99],
    ["USD", 19.99],
    ["GBP", 19.99],
  ])("formats %s without crashing and shows the expected value", (currency, amount) => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={amount}
        totalPrice={amount}
        currency={currency}
      />,
    );

    expect(
      screen.getByText(priceMatcher(amount, currency)),
    ).toBeInTheDocument();
  });

  it("formats JPY with no decimal places", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={1000}
        totalPrice={1000}
        currency="JPY"
      />,
    );

    expect(screen.getByText(priceMatcher(1000, "JPY"))).toBeInTheDocument();
    // JPY has zero minor units — assert that directly via resolvedOptions()
    // rather than pattern-matching the formatted string (a "," can be a
    // thousands separator as easily as a decimal one).
    expect(
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "JPY",
      }).resolvedOptions().maximumFractionDigits,
    ).toBe(0);
  });

  it("formats an uncommon but valid ISO currency (BHD, 3 decimal places) without crashing", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={12.345}
        totalPrice={12.345}
        currency="BHD"
      />,
    );

    // BHD renders as "BHD 12.345" (a non-breaking space between the
    // code and the amount) — byNormalizedText avoids a spurious mismatch
    // between that and a plain-space matcher string.
    expect(screen.getByText(priceMatcher(12.345, "BHD"))).toBeInTheDocument();
  });

  it("throws for a currency code that isn't well-formed ISO 4217 (documented limitation)", () => {
    // PackagePrice trusts `currency` to already be valid — Intl.NumberFormat
    // throws synchronously for a malformed code, and the component has no
    // fallback for it. Documented here rather than patched: `currency`
    // originates from the store owner's own Tebex account configuration,
    // not arbitrary/attacker-controlled input.
    expect(() =>
      render(<PackagePrice {...defaultProps} currency="NOT-A-CURRENCY" />),
    ).toThrow();
  });
});

describe("PackagePrice — edge cases", () => {
  it("renders negative values without crashing", () => {
    render(<PackagePrice {...defaultProps} basePrice={-10} totalPrice={-10} />);

    expect(screen.getByText(priceMatcher(-10, "USD"))).toBeInTheDocument();
  });

  it("renders a sale correctly when both prices are negative", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={-5}
        totalPrice={-10}
        discount={5}
      />,
    );

    expect(screen.getByText("Sale")).toBeInTheDocument();
    expect(screen.getByText(priceMatcher(-5, "USD"))).toBeInTheDocument();
    expect(screen.getByText(priceMatcher(-10, "USD"))).toBeInTheDocument();
  });

  it("handles an extremely large value without crashing", () => {
    const amount = 1e15;
    render(
      <PackagePrice {...defaultProps} basePrice={amount} totalPrice={amount} />,
    );

    expect(screen.getByText(priceMatcher(amount, "USD"))).toBeInTheDocument();
  });

  it("rounds fractional values with many decimal places the same way Intl.NumberFormat does", () => {
    const amount = 19.999999999;
    render(
      <PackagePrice {...defaultProps} basePrice={amount} totalPrice={amount} />,
    );

    expect(screen.getByText(priceMatcher(amount, "USD"))).toBeInTheDocument();
  });

  it("handles a basePrice of zero alongside a negative totalPrice", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={0}
        totalPrice={-5}
        discount={5}
      />,
    );

    expect(screen.getByText("Sale")).toBeInTheDocument();
    expect(screen.getByText(priceMatcher(0, "USD"))).toBeInTheDocument();
    expect(screen.getByText(priceMatcher(-5, "USD"))).toBeInTheDocument();
  });

  it("handles a totalPrice of zero", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={0}
        discount={10}
      />,
    );

    expect(screen.getByText("Sale")).toBeInTheDocument();
    expect(screen.getByText(priceMatcher(0, "USD"))).toBeInTheDocument();
  });

  it("still renders correctly when discount is far larger than the price itself", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={5}
        discount={1000}
      />,
    );

    // discount is only ever used as a boolean gate (discount > 0) — its
    // magnitude has no bearing on what's displayed.
    expect(screen.getByText("Sale")).toBeInTheDocument();
    expect(screen.getByText(priceMatcher(5, "USD"))).toBeInTheDocument();
  });

  it("does not crash on NaN or Infinity price values", () => {
    expect(() =>
      render(
        <PackagePrice
          {...defaultProps}
          basePrice={Number.NaN}
          totalPrice={Number.POSITIVE_INFINITY}
        />,
      ),
    ).not.toThrow();
  });

  it("renders two distinct price elements even when they format to identical text after rounding", () => {
    // 10.001 and 9.999 are different numbers — totalPrice < basePrice, so
    // this is a real sale — but both round to the same 2-decimal USD
    // display. The component isn't expected to detect that; it renders
    // exactly what it's given, in two separate elements.
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10.001}
        totalPrice={9.999}
        discount={1}
      />,
    );

    expect(screen.getByText("Sale")).toBeInTheDocument();
    expect(screen.getAllByText(priceMatcher(10, "USD"))).toHaveLength(2);
  });
});

describe("PackagePrice — accessibility", () => {
  it("renders the price as normal, queryable text", () => {
    render(
      <PackagePrice {...defaultProps} basePrice={9.99} totalPrice={9.99} />,
    );

    expect(screen.getByText(priceMatcher(9.99, "USD"))).toBeVisible();
  });

  it("keeps both sale prices and the Sale tag visible to assistive technology", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={8}
        discount={2}
      />,
    );

    expect(screen.getByText(priceMatcher(10, "USD"))).toBeVisible();
    expect(screen.getByText(priceMatcher(8, "USD"))).toBeVisible();
    expect(screen.getByText("Sale")).toBeVisible();
  });

  it("does not hide the struck-through original price from assistive technology", () => {
    render(
      <PackagePrice
        {...defaultProps}
        basePrice={10}
        totalPrice={8}
        discount={2}
      />,
    );

    const originalPrice = screen.getByText(priceMatcher(10, "USD"));
    expect(originalPrice).not.toHaveAttribute("aria-hidden");
    expect(originalPrice).not.toHaveAttribute("hidden");
  });
});
