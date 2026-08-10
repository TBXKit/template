import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Category } from "@/lib/tebex/types";
import { CategoryShowcase } from "./category-showcase";

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    name: "Ranks",
    description: "",
    packages: [],
    image_url: null,
    display_type: "grid",
    ...overrides,
  };
}

describe("CategoryShowcase", () => {
  it("renders a section heading above the category grid", () => {
    render(<CategoryShowcase categories={[]} currency="USD" />);

    expect(
      screen.getByRole("heading", { name: "Shop our packages" }),
    ).toBeInTheDocument();
  });

  it("passes categories through to CategoryGrid unchanged", () => {
    render(
      <CategoryShowcase
        categories={[buildCategory({ id: 1, name: "Ranks" })]}
        currency="USD"
      />,
    );

    expect(screen.getByRole("link", { name: "Ranks" })).toHaveAttribute(
      "href",
      "/category/1",
    );
  });
});
