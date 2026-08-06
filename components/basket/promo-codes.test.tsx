import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Basket } from "@/lib/tebex/types";
import { PromoCodes } from "./promo-codes";

// Each of the three sections renders its own "Apply" button, so a bare
// getByRole("button", { name: "Apply" }) is ambiguous whenever more than one
// section is visible at once — scope to the input's own <form> instead.
function applyButtonFor(input: HTMLElement): HTMLElement {
  const form = input.closest("form");
  if (!form) throw new Error("Expected input to be inside a form");
  return within(form).getByRole("button", { name: "Apply" });
}

const {
  applyCouponAction,
  applyCreatorCodeAction,
  applyGiftCardAction,
  removeCouponAction,
  removeCreatorCodeAction,
  removeGiftCardAction,
} = vi.hoisted(() => ({
  applyCouponAction: vi.fn(),
  applyCreatorCodeAction: vi.fn(),
  applyGiftCardAction: vi.fn(),
  removeCouponAction: vi.fn(),
  removeCreatorCodeAction: vi.fn(),
  removeGiftCardAction: vi.fn(),
}));

vi.mock("./promo-code-actions", () => ({
  applyCouponAction,
  applyCreatorCodeAction,
  applyGiftCardAction,
  removeCouponAction,
  removeCreatorCodeAction,
  removeGiftCardAction,
}));

function buildBasket(overrides: Partial<Basket> = {}): Basket {
  return {
    id: 1,
    ident: "basket-ident",
    complete: false,
    packages: [],
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

describe("PromoCodes — empty basket", () => {
  it("shows an apply form for all three code types and no applied entries", () => {
    render(<PromoCodes basket={buildBasket()} />);

    expect(screen.getByLabelText("Coupon code")).toBeInTheDocument();
    expect(screen.getByLabelText("Gift card number")).toBeInTheDocument();
    expect(screen.getByLabelText("Creator code")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();
  });
});

describe("PromoCodes — coupons (multi-entry)", () => {
  it("lists every applied coupon with a Remove control, alongside the apply form", () => {
    render(
      <PromoCodes
        basket={buildBasket({
          coupons: [{ code: "SAVE10" }, { code: "WELCOME" }],
        })}
      />,
    );

    expect(screen.getByText("SAVE10")).toBeInTheDocument();
    expect(screen.getByText("WELCOME")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
    expect(screen.getByLabelText("Coupon code")).toBeInTheDocument();
  });

  it("applies a coupon using the entered code", async () => {
    applyCouponAction.mockResolvedValueOnce({ success: true });
    render(<PromoCodes basket={buildBasket()} />);

    const input = screen.getByLabelText("Coupon code");
    fireEvent.change(input, { target: { value: "SAVE10" } });
    fireEvent.click(applyButtonFor(input));

    await waitFor(() => {
      expect(applyCouponAction).toHaveBeenCalledWith("SAVE10");
    });
  });

  it("shows the specific error message when applying a coupon fails", async () => {
    applyCouponAction.mockResolvedValueOnce({
      success: false,
      error: "The selected coupon code is invalid.",
    });
    render(<PromoCodes basket={buildBasket()} />);

    const input = screen.getByLabelText("Coupon code");
    fireEvent.change(input, { target: { value: "FAKE" } });
    fireEvent.click(applyButtonFor(input));

    expect(
      await screen.findByText("The selected coupon code is invalid."),
    ).toBeInTheDocument();
  });

  it("removes a coupon by its code", async () => {
    removeCouponAction.mockResolvedValueOnce({ success: true });
    render(
      <PromoCodes basket={buildBasket({ coupons: [{ code: "SAVE10" }] })} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(removeCouponAction).toHaveBeenCalledWith("SAVE10");
    });
  });
});

describe("PromoCodes — gift cards (multi-entry)", () => {
  it("lists every applied gift card with a Remove control", () => {
    render(
      <PromoCodes
        basket={buildBasket({ giftcards: [{ card_number: "1234 5678" }] })}
      />,
    );

    expect(screen.getByText("1234 5678")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("applies a gift card using the entered number", async () => {
    applyGiftCardAction.mockResolvedValueOnce({ success: true });
    render(<PromoCodes basket={buildBasket()} />);

    const input = screen.getByLabelText("Gift card number");
    fireEvent.change(input, { target: { value: "1111 2222" } });
    fireEvent.click(applyButtonFor(input));

    await waitFor(() => {
      expect(applyGiftCardAction).toHaveBeenCalledWith("1111 2222");
    });
  });

  it("shows the specific error message when applying a gift card fails", async () => {
    applyGiftCardAction.mockResolvedValueOnce({
      success: false,
      error: "Gift card not found",
    });
    render(<PromoCodes basket={buildBasket()} />);

    const input = screen.getByLabelText("Gift card number");
    fireEvent.change(input, { target: { value: "0000 0000" } });
    fireEvent.click(applyButtonFor(input));

    expect(await screen.findByText("Gift card not found")).toBeInTheDocument();
  });

  it("removes a gift card by its card number", async () => {
    removeGiftCardAction.mockResolvedValueOnce({ success: true });
    render(
      <PromoCodes
        basket={buildBasket({ giftcards: [{ card_number: "1234 5678" }] })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(removeGiftCardAction).toHaveBeenCalledWith("1234 5678");
    });
  });
});

describe("PromoCodes — creator code (single-entry, replaces rather than lists)", () => {
  it("shows only the applied creator code, not the apply form, once one is set", () => {
    render(<PromoCodes basket={buildBasket({ creator_code: "MyCreator" })} />);

    expect(screen.getByText("MyCreator")).toBeInTheDocument();
    expect(screen.queryByLabelText("Creator code")).not.toBeInTheDocument();
  });

  it("shows the apply form when no creator code is set", () => {
    render(<PromoCodes basket={buildBasket({ creator_code: null })} />);

    expect(screen.getByLabelText("Creator code")).toBeInTheDocument();
  });

  it("removes the creator code with no arguments", async () => {
    removeCreatorCodeAction.mockResolvedValueOnce({ success: true });
    render(<PromoCodes basket={buildBasket({ creator_code: "MyCreator" })} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(removeCreatorCodeAction).toHaveBeenCalledWith();
    });
  });

  it("applies a creator code using the entered value", async () => {
    applyCreatorCodeAction.mockResolvedValueOnce({ success: true });
    render(<PromoCodes basket={buildBasket()} />);

    const input = screen.getByLabelText("Creator code");
    fireEvent.change(input, { target: { value: "MyCreator" } });
    fireEvent.click(applyButtonFor(input));

    await waitFor(() => {
      expect(applyCreatorCodeAction).toHaveBeenCalledWith("MyCreator");
    });
  });

  it("shows the specific error message when applying a creator code fails", async () => {
    applyCreatorCodeAction.mockResolvedValueOnce({
      success: false,
      error: "Creator code not found",
    });
    render(<PromoCodes basket={buildBasket()} />);

    const input = screen.getByLabelText("Creator code");
    fireEvent.change(input, { target: { value: "FakeCreator" } });
    fireEvent.click(applyButtonFor(input));

    expect(
      await screen.findByText("Creator code not found"),
    ).toBeInTheDocument();
  });
});
