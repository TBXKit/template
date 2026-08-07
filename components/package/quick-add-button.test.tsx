import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/toast-provider";
import { QuickAddButton } from "./quick-add-button";

const { addToBasketAction } = vi.hoisted(() => ({
  addToBasketAction: vi.fn(),
}));

vi.mock("./add-to-basket-action", () => ({
  addToBasketAction,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/category/1",
}));

describe("QuickAddButton", () => {
  it("submits quantity 1 with no variables and no gift target", async () => {
    addToBasketAction.mockResolvedValueOnce({ success: true });
    render(<QuickAddButton packageId={7} />);

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    await waitFor(() => {
      expect(addToBasketAction).toHaveBeenCalledWith(
        7,
        1,
        undefined,
        "/category/1",
        undefined,
      );
    });
  });

  it("shows a success message after adding", async () => {
    addToBasketAction.mockResolvedValueOnce({ success: true });
    render(<QuickAddButton packageId={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    expect(await screen.findByText("Added")).toBeInTheDocument();
  });

  it("shows the error message and re-enables the button when the action fails", async () => {
    addToBasketAction.mockResolvedValueOnce({
      success: false,
      error: "Could not add this package to your basket. Please try again.",
    });
    render(<QuickAddButton packageId={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    expect(
      await screen.findByText(
        "Could not add this package to your basket. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to basket" })).toBeEnabled();
  });
});

describe("QuickAddButton — toast", () => {
  it("also shows a toast on success, for visibility off-screen in a grid", async () => {
    addToBasketAction.mockResolvedValueOnce({ success: true });
    render(
      <ToastProvider>
        <QuickAddButton packageId={1} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Added to your basket.",
    );
  });

  it("shows the same error in the toast as inline", async () => {
    addToBasketAction.mockResolvedValueOnce({
      success: false,
      error: "Could not add this package to your basket. Please try again.",
    });
    render(
      <ToastProvider>
        <QuickAddButton packageId={1} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Could not add this package to your basket. Please try again.",
    );
  });
});
