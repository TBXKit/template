import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./breadcrumbs";

describe("Breadcrumbs", () => {
  it("exposes a labelled breadcrumb navigation landmark", () => {
    render(<Breadcrumbs items={[{ label: "Home", href: "/" }]} />);

    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
  });

  it("renders items with an href as links", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Ranks", href: "/category/1" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Ranks" })).toHaveAttribute(
      "href",
      "/category/1",
    );
  });

  it("renders the trailing item without an href as the current page, not a link", () => {
    render(
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "VIP Rank" }]}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "VIP Rank" }),
    ).not.toBeInTheDocument();
    const current = screen.getByText("VIP Rank");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("does not render a separator before the first item", () => {
    const { container } = render(
      <Breadcrumbs items={[{ label: "Home", href: "/" }]} />,
    );

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it("renders a separator between each subsequent item", () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Ranks", href: "/category/1" },
          { label: "VIP Rank" },
        ]}
      />,
    );

    const separators = within(
      container.querySelector("ol") as HTMLElement,
    ).getAllByText("/");
    expect(separators).toHaveLength(2);
  });
});
