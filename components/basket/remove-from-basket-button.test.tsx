import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemoveFromBasketButton } from "./remove-from-basket-button";

const { removeFromBasketAction } = vi.hoisted(() => ({
  removeFromBasketAction: vi.fn(),
}));

vi.mock("./remove-from-basket-action", () => ({
  removeFromBasketAction,
}));

describe("RemoveFromBasketButton", () => {
  it("renders a Remove button initially", () => {
    render(<RemoveFromBasketButton packageId={1} />);

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("shows a specific error message and re-enables the button when the action fails", async () => {
    removeFromBasketAction.mockResolvedValueOnce({
      success: false,
      error: "Could not remove this item. Please try again.",
    });
    render(<RemoveFromBasketButton packageId={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(
      await screen.findByText("Could not remove this item. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();
  });

  it("calls the action with the given packageId", async () => {
    removeFromBasketAction.mockResolvedValueOnce({ success: true });
    render(<RemoveFromBasketButton packageId={42} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(removeFromBasketAction).toHaveBeenCalledWith(42);
    });
  });

  it("shows no error message after a successful removal", async () => {
    removeFromBasketAction.mockResolvedValueOnce({ success: true });
    render(<RemoveFromBasketButton packageId={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(removeFromBasketAction).toHaveBeenCalled();
    });
    expect(screen.queryByText(/could not remove/i)).not.toBeInTheDocument();
  });
});
