import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Category } from "@/lib/tebex/types";
import { CategoryGrid } from "./category-grid";

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    name: "Ranks",
    description: "Server ranks",
    packages: [],
    image_url: null,
    display_type: "grid",
    ...overrides,
  };
}

describe("CategoryGrid — empty state", () => {
  it("shows a dedicated empty message when there are no categories", () => {
    render(<CategoryGrid categories={[]} />);

    expect(screen.getByText("No categories yet.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("CategoryGrid — with categories", () => {
  it("renders a link to each category", () => {
    render(
      <CategoryGrid
        categories={[
          buildCategory({ id: 1, name: "Ranks" }),
          buildCategory({ id: 2, name: "Cosmetics" }),
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /Ranks/ })).toHaveAttribute(
      "href",
      "/category/1",
    );
    expect(screen.getByRole("link", { name: /Cosmetics/ })).toHaveAttribute(
      "href",
      "/category/2",
    );
  });

  it("pluralizes the package count correctly", () => {
    render(
      <CategoryGrid
        categories={[
          buildCategory({ id: 1, packages: [{ ...basePackage(), id: 1 }] }),
          buildCategory({ id: 2, packages: [] }),
        ]}
      />,
    );

    expect(screen.getByText("1 package")).toBeInTheDocument();
    expect(screen.getByText("0 packages")).toBeInTheDocument();
  });

  it("does not render a description paragraph when the category has none", () => {
    render(<CategoryGrid categories={[buildCategory({ description: "" })]} />);

    expect(screen.queryByText("Server ranks")).not.toBeInTheDocument();
  });

  it("renders an HTML description as real markup, not escaped text", () => {
    const { container } = render(
      <CategoryGrid
        categories={[
          buildCategory({
            description: "<p>Server <strong>ranks</strong></p>",
          }),
        ]}
      />,
    );

    // Regression guard: TebexHtml renders an <article>, which is invalid
    // (and previously *was* nested) inside a <p> — this asserts there's no
    // <p> ancestor for it, since that specific mistake only causes a
    // hydration-mismatch warning in a real browser, not a jsdom/RTL failure.
    const strong = container.querySelector("strong");
    expect(strong).toHaveTextContent("ranks");
    expect(strong?.closest("p")).not.toBeNull();
    expect(strong?.closest("article")?.closest("p")).toBeNull();
  });
});

function basePackage() {
  return {
    id: 1,
    name: "VIP",
    description: "",
    image: null,
    media: [],
    type: "single" as const,
    base_price: 10,
    discount: 0,
    total_price: 10,
    expiration_date: null,
    category: { id: 1, name: "Ranks" },
    variables: [],
    disable_quantity: false,
    disable_gifting: false,
  };
}
