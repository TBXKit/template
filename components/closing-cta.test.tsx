import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClosingCta } from "./closing-cta";

describe("ClosingCta", () => {
  it("links to the search page as its call to action", () => {
    render(<ClosingCta />);

    expect(
      screen.getByRole("link", { name: "Browse the store" }),
    ).toHaveAttribute("href", "/search");
  });

  it("renders as obviously-placeholder content, not finished copy", () => {
    render(<ClosingCta />);

    expect(screen.getByText(/Closing pitch goes here/)).toBeInTheDocument();
  });
});
