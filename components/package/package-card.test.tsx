import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Package } from "@/lib/tebex/types";
import { PackageCard } from "./package-card";

const { addToBasketAction } = vi.hoisted(() => ({
  addToBasketAction: vi.fn(),
}));

vi.mock("./add-to-basket-action", () => ({
  addToBasketAction,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/category/1",
}));

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

describe("PackageCard — link", () => {
  it("links to the package's detail page", () => {
    render(<PackageCard pkg={buildPackage()} currency="USD" />);

    expect(screen.getByRole("link", { name: /VIP Rank/ })).toHaveAttribute(
      "href",
      "/package/1",
    );
  });
});

describe("PackageCard — quick add", () => {
  it("shows a quick-add button for a package with no variables", () => {
    render(
      <PackageCard pkg={buildPackage({ variables: [] })} currency="USD" />,
    );

    expect(
      screen.getByRole("button", { name: "Add to basket" }),
    ).toBeInTheDocument();
  });

  it("omits the quick-add button for a package that has variables", () => {
    render(
      <PackageCard
        pkg={buildPackage({
          variables: [{ identifier: "colour", type: "dropdown", options: [] }],
        })}
        currency="USD"
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Add to basket" }),
    ).not.toBeInTheDocument();
  });

  it("is not nested inside the detail-page link", () => {
    render(<PackageCard pkg={buildPackage()} currency="USD" />);

    const button = screen.getByRole("button", { name: "Add to basket" });
    expect(button.closest("a")).toBeNull();
  });
});
