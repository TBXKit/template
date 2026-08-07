import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Category, Webstore } from "@/lib/tebex/types";
import { Header } from "./header";

vi.mock("@/components/auth/logout-action", () => ({
  logoutAction: vi.fn(),
}));

function buildWebstore(overrides: Partial<Webstore> = {}): Webstore {
  return {
    id: 1,
    name: "dev-theme",
    description: "",
    logo: null,
    currency: "USD",
    lang: "en",
    disabled: false,
    platform_type: "Minecraft: Java Edition",
    supports_usernames: true,
    supports_gifting: false,
    ...overrides,
  };
}

const categories: Category[] = [
  {
    id: 10,
    name: "Ranks",
    description: "",
    packages: [],
    image_url: null,
    display_type: "grid",
  },
];

describe("Header — branding and navigation", () => {
  it("renders the store name and a link to each category", () => {
    render(<Header webstore={buildWebstore()} categories={categories} />);

    expect(screen.getAllByText("dev-theme").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Ranks" })[0]).toHaveAttribute(
      "href",
      "/category/10",
    );
  });

  it("renders the store logo when one is configured", () => {
    render(
      <Header
        webstore={buildWebstore({ logo: "https://example.com/logo.png" })}
        categories={categories}
      />,
    );

    // alt="" is deliberate (decorative — the store name is already adjacent
    // text), which gives the image an implicit presentation role rather
    // than "img", so it's queried directly rather than via getByRole.
    const logo = document.querySelector("img");
    expect(logo).toHaveAttribute("src", expect.stringContaining("logo.png"));
  });
});

describe("Header — cart badge", () => {
  it("shows no count badge when the basket is empty", () => {
    render(
      <Header
        webstore={buildWebstore()}
        categories={categories}
        itemCount={0}
      />,
    );

    const cartLinks = screen.getAllByRole("link", { name: /cart/i });
    expect(cartLinks[0]).toHaveTextContent(/^Cart$/);
  });

  it("shows the item count when the basket has items", () => {
    render(
      <Header
        webstore={buildWebstore()}
        categories={categories}
        itemCount={3}
      />,
    );

    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });
});

describe("Header — auth state", () => {
  it("shows a Login link when no one is signed in", () => {
    render(
      <Header
        webstore={buildWebstore()}
        categories={categories}
        username={null}
      />,
    );

    expect(
      screen.getAllByRole("link", { name: "Login" }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument();
  });

  it("shows the signed-in identity and a Logout control when a username is present", () => {
    render(
      <Header
        webstore={buildWebstore()}
        categories={categories}
        username="Notch"
      />,
    );

    expect(screen.getAllByText("Signed in as Notch").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Logout" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: "Login" }),
    ).not.toBeInTheDocument();
  });

  it("links the signed-in identity to /account", () => {
    render(
      <Header
        webstore={buildWebstore()}
        categories={categories}
        username="Notch"
      />,
    );

    const accountLinks = screen.getAllByRole("link", {
      name: "Signed in as Notch",
    });
    for (const link of accountLinks) {
      expect(link).toHaveAttribute("href", "/account");
    }
  });

  it("shows a player avatar next to the signed-in identity on a Minecraft store", () => {
    // alt="" gives the avatar an implicit "presentation" role, not "img" —
    // queried by src directly rather than via getByRole, same reasoning as
    // player-avatar.test.tsx.
    const { container } = render(
      <Header
        webstore={buildWebstore({ platform_type: "Minecraft: Java Edition" })}
        categories={categories}
        username="Notch"
      />,
    );

    expect(
      container.querySelectorAll('img[src*="mc-heads.net"]').length,
    ).toBeGreaterThan(0);
  });

  it("omits the player avatar on a non-Minecraft store", () => {
    const { container } = render(
      <Header
        webstore={buildWebstore({ platform_type: "Steam" })}
        categories={categories}
        username="Notch"
      />,
    );

    // The signed-in identity is still shown as text, just without an avatar.
    expect(screen.getAllByText("Signed in as Notch").length).toBeGreaterThan(0);
    expect(container.querySelectorAll('img[src*="mc-heads.net"]')).toHaveLength(
      0,
    );
  });
});
