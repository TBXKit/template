import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Category, Package } from "@/lib/tebex/types";
import { CategoryDetail } from "./category-detail";

function buildPackage(overrides: Partial<Package> = {}): Package {
  return {
    id: 1,
    name: "VIP Rank",
    description: "",
    image: null,
    media: [],
    type: "single",
    base_price: 10,
    discount: 0,
    total_price: 10,
    expiration_date: null,
    category: { id: 1, name: "Ranks" },
    variables: [],
    disable_quantity: false,
    disable_gifting: false,
    ...overrides,
  };
}

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

describe("CategoryDetail — empty state", () => {
  it("shows a dedicated empty message when the category has no packages", () => {
    render(<CategoryDetail category={buildCategory()} currency="USD" />);

    expect(
      screen.getByText("No packages in this category yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("CategoryDetail — with packages", () => {
  it("renders every package as a link to its detail page", () => {
    render(
      <CategoryDetail
        category={buildCategory({
          packages: [
            buildPackage({ id: 1, name: "VIP Rank" }),
            buildPackage({ id: 2, name: "MVP Rank" }),
          ],
        })}
        currency="USD"
      />,
    );

    expect(screen.getByRole("link", { name: /VIP Rank/ })).toHaveAttribute(
      "href",
      "/package/1",
    );
    expect(screen.getByRole("link", { name: /MVP Rank/ })).toHaveAttribute(
      "href",
      "/package/2",
    );
  });

  it("renders the category name and description as page heading content", () => {
    render(
      <CategoryDetail
        category={buildCategory({ name: "Ranks", description: "Server ranks" })}
        currency="USD"
      />,
    );

    expect(screen.getByRole("heading", { name: "Ranks" })).toBeInTheDocument();
    expect(screen.getByText("Server ranks")).toBeInTheDocument();
  });
});
