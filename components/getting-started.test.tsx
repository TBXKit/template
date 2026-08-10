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

  it("lists the setup steps in the order a fresh clone actually requires", () => {
    render(<GettingStarted />);

    const heading = screen.getByRole("heading", { name: "Setup steps" });
    const list = heading.nextElementSibling as HTMLElement;
    const stepTitles = Array.from(list.querySelectorAll("p.font-medium")).map(
      (el) => el.textContent,
    );

    expect(stepTitles).toEqual([
      "Set TEBEX_PUBLIC_TOKEN",
      "Add categories and packages",
      "Set HOMEPAGE_MODE=storefront",
    ]);
  });

  it("notes that TEBEX_PUBLIC_TOKEN is already satisfied by the time this page renders", () => {
    render(<GettingStarted />);

    expect(screen.getByText(/already done/)).toBeInTheDocument();
  });

  it("links to the Tebex dashboard and API docs as resources", () => {
    render(<GettingStarted />);

    expect(
      screen.getByRole("link", { name: "Tebex creator dashboard" }),
    ).toHaveAttribute("href", "https://creator.tebex.io");
    expect(
      screen.getByRole("link", { name: "Tebex Headless API docs" }),
    ).toHaveAttribute(
      "href",
      "https://docs.tebex.io/developers/headless-api/overview",
    );
  });

  it("summarizes what the template includes", () => {
    render(<GettingStarted />);

    expect(
      screen.getByRole("heading", { name: "What this template includes" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Checkout via Tebex\.js/)).toBeInTheDocument();
  });
});
