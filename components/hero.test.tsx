import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
  it("renders the store name as the page's top-level heading", () => {
    render(<Hero title="Diamond Store" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Diamond Store" }),
    ).toBeInTheDocument();
  });

  it("renders the description as rich text when one is supplied", () => {
    render(
      <Hero
        title="Diamond Store"
        description="<p>Best <em>ranks</em> around.</p>"
      />,
    );

    expect(screen.getByText(/best/i)).toBeInTheDocument();
    expect(screen.getByText("ranks")).toBeInTheDocument();
  });

  it("omits the description block entirely when none is supplied", () => {
    const { container } = render(<Hero title="Diamond Store" />);

    // TebexHtml renders an <article>; there should be none without a description.
    expect(container.querySelector("article")).toBeNull();
  });

  it("treats an empty-string description as no description", () => {
    const { container } = render(<Hero title="Diamond Store" description="" />);

    expect(container.querySelector("article")).toBeNull();
  });
});
