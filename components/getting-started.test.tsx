import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GettingStarted } from "./getting-started";

describe("GettingStarted", () => {
  it("links to the search page as its call to action", () => {
    render(<GettingStarted />);

    expect(
      screen.getByRole("link", { name: "Browse the store" }),
    ).toHaveAttribute("href", "/search");
  });
});
