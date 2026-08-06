import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Basket } from "@/lib/tebex/types";
import { CheckoutPanel } from "./checkout-panel";

// The mocked Tebex.js `on()` callbacks are invoked directly in tests below,
// bypassing React's synthetic event system — the resulting setState calls
// need an explicit act() to flush before assertions, unlike fireEvent
// (which already wraps in act() internally).
async function fireHandler(handler: () => void) {
  await act(async () => {
    handler();
  });
}

const { checkout, handlers, routerRefresh, completeCheckoutAction } =
  vi.hoisted(() => {
    const handlers: Record<string, () => void> = {};
    return {
      handlers,
      routerRefresh: vi.fn(),
      completeCheckoutAction: vi.fn().mockResolvedValue(undefined),
      checkout: {
        init: vi.fn(),
        launch: vi.fn(),
        on: vi.fn((event: string, callback: () => void) => {
          handlers[event] = callback;
        }),
      },
    };
  });

vi.mock("@tebexio/tebex.js", () => ({ checkout }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("./checkout-action", () => ({ completeCheckoutAction }));

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(handlers)) delete handlers[key];
  completeCheckoutAction.mockResolvedValue(undefined);
});

// PromoCodes has its own dedicated test file (promo-codes.test.tsx) and
// transitively depends on Server Actions that call the live Tebex API —
// stubbed here so this file can stay focused on CheckoutPanel's own
// checkout-launch/event state machine.
vi.mock("./promo-codes", () => ({
  PromoCodes: () => <div data-testid="promo-codes-stub" />,
}));

function buildBasket(overrides: Partial<Basket> = {}): Basket {
  return {
    id: 1,
    ident: "basket-ident",
    complete: false,
    packages: [
      { id: 100, name: "VIP Rank", image: null, quantity: 1, price: 10 },
    ],
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

describe("CheckoutPanel — idle state", () => {
  it("renders the basket summary and a Checkout button", () => {
    render(<CheckoutPanel basket={buildBasket()} currency="USD" />);

    expect(screen.getByText("VIP Rank")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Checkout" }),
    ).toBeInTheDocument();
  });

  it("initializes and launches Tebex.js checkout with the basket's ident on click", () => {
    render(
      <CheckoutPanel
        basket={buildBasket({ ident: "abc-123" })}
        currency="USD"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    expect(checkout.init).toHaveBeenCalledWith({
      ident: "abc-123",
      theme: "auto",
    });
    expect(checkout.launch).toHaveBeenCalled();
  });

  it("only initializes once across repeated clicks", () => {
    render(<CheckoutPanel basket={buildBasket()} currency="USD" />);
    const button = screen.getByRole("button", { name: "Checkout" });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(checkout.init).toHaveBeenCalledTimes(1);
    expect(checkout.launch).toHaveBeenCalledTimes(2);
  });
});

describe("CheckoutPanel — payment:error", () => {
  it("shows a visible error message and stays on the basket view", async () => {
    render(<CheckoutPanel basket={buildBasket()} currency="USD" />);
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await fireHandler(handlers["payment:error"]);

    expect(
      screen.getByText(
        "There was a problem processing your payment. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Checkout" }),
    ).toBeInTheDocument();
  });
});

describe("CheckoutPanel — close without completing", () => {
  it("refreshes the route to re-fetch the basket", async () => {
    render(<CheckoutPanel basket={buildBasket()} currency="USD" />);
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await fireHandler(handlers.close);

    expect(routerRefresh).toHaveBeenCalled();
  });
});

describe("CheckoutPanel — payment:complete", () => {
  it("replaces the basket view with a distinct confirmation message", async () => {
    render(<CheckoutPanel basket={buildBasket()} currency="USD" />);
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await fireHandler(handlers["payment:complete"]);

    expect(
      screen.getByText("Thank you for your purchase!"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Checkout" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("VIP Rank")).not.toBeInTheDocument();
  });

  it("clears the basket session via the server action", async () => {
    render(<CheckoutPanel basket={buildBasket()} currency="USD" />);
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await fireHandler(handlers["payment:complete"]);

    expect(completeCheckoutAction).toHaveBeenCalled();
  });

  it("does not refresh the route on a subsequent close event (would flip back to the empty-basket state)", async () => {
    render(<CheckoutPanel basket={buildBasket()} currency="USD" />);
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await fireHandler(handlers["payment:complete"]);
    routerRefresh.mockClear();
    await fireHandler(handlers.close);

    expect(routerRefresh).not.toHaveBeenCalled();
  });
});
