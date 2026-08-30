import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BasketEmpty } from "./basket-empty";

describe("BasketEmpty", () => {
  it("tells the visitor the basket is empty", () => {
    render(<BasketEmpty />);

    expect(
      screen.getByRole("heading", { name: "Your basket is empty" }),
    ).toBeInTheDocument();
  });

  it("links back to the store home", () => {
    render(<BasketEmpty />);

    const link = screen.getByRole("link", { name: "Back to store" });
    expect(link).toHaveAttribute("href", "/");
  });
});
