import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PackageVariable } from "@/lib/tebex/types";
import { AddToBasketButton } from "./add-to-basket-button";

const { addToBasketAction } = vi.hoisted(() => ({
  addToBasketAction: vi.fn(),
}));

vi.mock("./add-to-basket-action", () => ({
  addToBasketAction,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/package/123",
}));

const dropdownVariable: PackageVariable = {
  identifier: "colour",
  type: "dropdown",
  options: [
    { name: "Red", value: "red" },
    { name: "Blue", value: "blue" },
  ],
};

const textVariable: PackageVariable = {
  identifier: "engraving",
  type: "text",
  options: [],
};

describe("AddToBasketButton — no variables, no gifting", () => {
  it("renders an enabled submit button and a quantity input by default", () => {
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Add to basket" })).toBeEnabled();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
  });

  it("omits the quantity input when disableQuantity is true", () => {
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={true}
        canGift={false}
      />,
    );

    expect(screen.queryByLabelText("Quantity")).not.toBeInTheDocument();
  });

  it("omits the gift checkbox when canGift is false", () => {
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    expect(screen.queryByText(/buy as a gift/i)).not.toBeInTheDocument();
  });

  it("submits with the default quantity, no variables, and no gift target", async () => {
    addToBasketAction.mockResolvedValueOnce({ success: true });
    render(
      <AddToBasketButton
        packageId={7}
        variables={[]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    await waitFor(() => {
      expect(addToBasketAction).toHaveBeenCalledWith(
        7,
        1,
        {},
        "/package/123",
        undefined,
      );
    });
  });

  it("submits the updated quantity after the visitor changes it", async () => {
    addToBasketAction.mockResolvedValueOnce({ success: true });
    render(
      <AddToBasketButton
        packageId={7}
        variables={[]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    await waitFor(() => {
      expect(addToBasketAction).toHaveBeenCalledWith(
        7,
        3,
        {},
        "/package/123",
        undefined,
      );
    });
  });

  it("shows a success message after adding", async () => {
    addToBasketAction.mockResolvedValueOnce({ success: true });
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    expect(
      await screen.findByText("Added to your basket."),
    ).toBeInTheDocument();
  });

  it("shows the error message and re-enables the button when the action fails", async () => {
    addToBasketAction.mockResolvedValueOnce({
      success: false,
      error: "Could not add this package to your basket. Please try again.",
    });
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    expect(
      await screen.findByText(
        "Could not add this package to your basket. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to basket" })).toBeEnabled();
  });
});

describe("AddToBasketButton — required variables", () => {
  it("disables submit until every variable has a value", () => {
    render(
      <AddToBasketButton
        packageId={1}
        variables={[dropdownVariable, textVariable]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Add to basket" }),
    ).toBeDisabled();
  });

  it("enables submit once all variables are filled, and submits their values", async () => {
    addToBasketAction.mockResolvedValueOnce({ success: true });
    render(
      <AddToBasketButton
        packageId={1}
        variables={[dropdownVariable, textVariable]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("colour"), {
      target: { value: "blue" },
    });
    fireEvent.change(screen.getByLabelText("engraving"), {
      target: { value: "Happy Birthday" },
    });

    expect(screen.getByRole("button", { name: "Add to basket" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    await waitFor(() => {
      expect(addToBasketAction).toHaveBeenCalledWith(
        1,
        1,
        { colour: "blue", engraving: "Happy Birthday" },
        "/package/123",
        undefined,
      );
    });
  });

  it("renders dropdown options for a dropdown-type variable", () => {
    render(
      <AddToBasketButton
        packageId={1}
        variables={[dropdownVariable]}
        disableQuantity={false}
        canGift={false}
      />,
    );

    expect(screen.getByRole("option", { name: "Red" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Blue" })).toBeInTheDocument();
  });
});

describe("AddToBasketButton — gifting", () => {
  it("shows the gift checkbox but no recipient input until checked", () => {
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={false}
        canGift={true}
      />,
    );

    expect(screen.getByText(/buy as a gift/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Recipient's username"),
    ).not.toBeInTheDocument();
  });

  it("reveals the recipient input and gates submit on it once checked", () => {
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={false}
        canGift={true}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /buy as a gift/i }));

    expect(screen.getByLabelText("Recipient's username")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add to basket" }),
    ).toBeDisabled();
  });

  it("submits the trimmed gift username once filled, and shows the gift success message", async () => {
    addToBasketAction.mockResolvedValueOnce({ success: true });
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={false}
        canGift={true}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /buy as a gift/i }));
    fireEvent.change(screen.getByLabelText("Recipient's username"), {
      target: { value: "  Notch  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    await waitFor(() => {
      expect(addToBasketAction).toHaveBeenCalledWith(
        1,
        1,
        {},
        "/package/123",
        "Notch",
      );
    });
    expect(
      await screen.findByText("Gift added to your basket."),
    ).toBeInTheDocument();
  });

  it("shows the specific gift-target error message returned by the action", async () => {
    addToBasketAction.mockResolvedValueOnce({
      success: false,
      error: "User not found",
    });
    render(
      <AddToBasketButton
        packageId={1}
        variables={[]}
        disableQuantity={false}
        canGift={true}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /buy as a gift/i }));
    fireEvent.change(screen.getByLabelText("Recipient's username"), {
      target: { value: "nobody" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to basket" }));

    expect(await screen.findByText("User not found")).toBeInTheDocument();
  });
});
