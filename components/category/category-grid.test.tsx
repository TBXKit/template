import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Category, Package } from "@/lib/tebex/types";
import { CategoryGrid } from "./category-grid";

const { addToBasketAction } = vi.hoisted(() => ({
  addToBasketAction: vi.fn(),
}));

vi.mock("@/components/package/add-to-basket-action", () => ({
  addToBasketAction,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function buildPackage(overrides: Partial<Package> = {}): Package {
  return {
    id: 1,
    name: "VIP",
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

describe("CategoryGrid — empty state", () => {
  it("shows a dedicated empty message when there are no categories", () => {
    render(<CategoryGrid categories={[]} currency="USD" />);

    expect(screen.getByText("No categories yet.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("CategoryGrid — with categories", () => {
  it("renders a heading link to each category", () => {
    render(
      <CategoryGrid
        categories={[
          buildCategory({ id: 1, name: "Ranks" }),
          buildCategory({ id: 2, name: "Cosmetics" }),
        ]}
        currency="USD"
      />,
    );

    expect(screen.getByRole("link", { name: "Ranks" })).toHaveAttribute(
      "href",
      "/category/1",
    );
    expect(screen.getByRole("link", { name: "Cosmetics" })).toHaveAttribute(
      "href",
      "/category/2",
    );
  });

  it("shows a dedicated empty message for a category with no packages", () => {
    render(
      <CategoryGrid
        categories={[buildCategory({ packages: [] })]}
        currency="USD"
      />,
    );

    expect(
      screen.getByText("No packages in this category yet."),
    ).toBeInTheDocument();
  });

  it("previews a package as a link to its detail page", () => {
    render(
      <CategoryGrid
        categories={[
          buildCategory({
            packages: [buildPackage({ id: 5, name: "VIP Rank" })],
          }),
        ]}
        currency="USD"
      />,
    );

    expect(screen.getByRole("link", { name: /VIP Rank/ })).toHaveAttribute(
      "href",
      "/package/5",
    );
  });

  it("does not show a 'view all' link when packages fit within the preview limit", () => {
    render(
      <CategoryGrid
        categories={[
          buildCategory({
            packages: [
              buildPackage({ id: 1 }),
              buildPackage({ id: 2 }),
              buildPackage({ id: 3 }),
            ],
          }),
        ]}
        currency="USD"
      />,
    );

    expect(screen.queryByText(/View all/)).not.toBeInTheDocument();
  });

  it("shows a 'view all' link to the category page when there are more packages than the preview limit", () => {
    render(
      <CategoryGrid
        categories={[
          buildCategory({
            id: 7,
            packages: [
              buildPackage({ id: 1 }),
              buildPackage({ id: 2 }),
              buildPackage({ id: 3 }),
              buildPackage({ id: 4 }),
            ],
          }),
        ]}
        currency="USD"
      />,
    );

    const viewAll = screen.getByRole("link", {
      name: /View all 4 packages/,
    });
    expect(viewAll).toHaveAttribute("href", "/category/7");
    // Only the preview-limited packages render, not the 4th.
    const packageLinkHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href) => href?.startsWith("/package/"));
    expect(packageLinkHrefs).toEqual([
      "/package/1",
      "/package/2",
      "/package/3",
    ]);
  });

  it("does not render a description paragraph when the category has none", () => {
    render(
      <CategoryGrid
        categories={[buildCategory({ description: "" })]}
        currency="USD"
      />,
    );

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
        currency="USD"
      />,
    );

    // Regression guard: TebexHtml renders an <article>, which is invalid
    // inside a <p> — this asserts there's no <p> ancestor for it, since
    // that specific mistake only causes a hydration-mismatch warning in a
    // real browser, not a jsdom/RTL failure.
    const strong = container.querySelector("strong");
    expect(strong).toHaveTextContent("ranks");
    expect(strong?.closest("p")).not.toBeNull();
    expect(strong?.closest("article")?.closest("p")).toBeNull();
  });
});
