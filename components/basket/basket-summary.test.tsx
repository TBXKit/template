import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Basket, BasketPackage } from "@/lib/tebex/types";
import { BasketSummary } from "./basket-summary";

// RemoveFromBasketButton (rendered per line item) imports a Server Action.
vi.mock("./remove-from-basket-action", () => ({
  removeFromBasketAction: vi.fn(),
}));

function buildItem(overrides: Partial<BasketPackage> = {}): BasketPackage {
  return {
    id: 1,
    name: "VIP Rank",
    image: null,
    quantity: 1,
    price: 10,
    ...overrides,
  };
}

function buildBasket(overrides: Partial<Basket> = {}): Basket {
  return {
    id: 1,
    ident: "basket-abc",
    complete: false,
    packages: [buildItem()],
    coupons: [],
    giftcards: [],
    creator_code: null,
    base_price: 10,
    total_price: 10,
    currency: "USD",
    username: null,
    ...overrides,
  };
}

// Locale-independent: compare against the same formatted string
// Intl.NumberFormat produces, rather than a hardcoded "$10.00". Whitespace is
// normalized on both sides because, depending on the host ICU version, the
// currency symbol and amount are joined by U+202F/U+00A0 in the DOM — which
// RTL's string matchers normalize on the DOM side but not the expected side.
function money(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

function hasMoney(el: HTMLElement, amount: number, currency = "USD"): boolean {
  return squash(el.textContent ?? "").includes(squash(money(amount, currency)));
}

describe("BasketSummary", () => {
  it("renders one row per package with its name and quantity", () => {
    const basket = buildBasket({
      packages: [
        buildItem({ id: 1, name: "VIP Rank", quantity: 2 }),
        buildItem({ id: 2, name: "Starter Kit", quantity: 1 }),
      ],
    });
    render(<BasketSummary basket={basket} currency="USD" />);

    expect(screen.getByText("VIP Rank")).toBeInTheDocument();
    expect(screen.getByText("Starter Kit")).toBeInTheDocument();
    expect(screen.getByText("Qty: 2")).toBeInTheDocument();
    expect(screen.getByText("Qty: 1")).toBeInTheDocument();
  });

  it("shows each line-item price and the basket total in the store currency", () => {
    const basket = buildBasket({
      packages: [buildItem({ name: "VIP Rank", price: 12.5 })],
      total_price: 30,
    });
    render(<BasketSummary basket={basket} currency="USD" />);

    const row = screen.getByText("VIP Rank").closest("li") as HTMLElement;
    expect(hasMoney(row, 12.5)).toBe(true);

    const total = screen.getByText("Total").parentElement as HTMLElement;
    expect(hasMoney(total, 30)).toBe(true);
  });

  it("renders a Remove control for every line item", () => {
    const basket = buildBasket({
      packages: [
        buildItem({ id: 1, name: "A" }),
        buildItem({ id: 2, name: "B" }),
      ],
    });
    render(<BasketSummary basket={basket} currency="USD" />);

    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
  });

  it("renders the package image only when one is present", () => {
    const { rerender } = render(
      <BasketSummary
        basket={buildBasket({ packages: [buildItem({ image: null })] })}
        currency="USD"
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(
      <BasketSummary
        basket={buildBasket({
          packages: [
            buildItem({
              image: "https://cdn.example/vip.png",
              name: "VIP Rank",
            }),
          ],
        })}
        currency="USD"
      />,
    );
    expect(screen.getByRole("img", { name: "VIP Rank" })).toBeInTheDocument();
  });

  it("renders an empty list without crashing", () => {
    render(
      <BasketSummary
        basket={buildBasket({ packages: [], total_price: 0 })}
        currency="USD"
      />,
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Remove" })).toHaveLength(0);
  });
});
