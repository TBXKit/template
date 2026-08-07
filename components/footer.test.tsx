import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./footer";

describe("Footer — required Tebex disclosure", () => {
  it("always shows the merchant-of-record statement and legal links, regardless of props", () => {
    render(<Footer siteName="dev-theme" />);

    expect(
      screen.getByText(/reseller and merchant of record/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Impressum" })).toHaveAttribute(
      "href",
      "https://checkout.tebex.io/impressum",
    );
    expect(
      screen.getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", "https://checkout.tebex.io/terms");
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "https://checkout.tebex.io/privacy");
  });
});

describe("Footer — optional content", () => {
  it("omits the Discord link when discordUrl isn't set", () => {
    render(<Footer siteName="dev-theme" />);

    expect(
      screen.queryByRole("link", { name: /discord/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a Discord link when discordUrl is set", () => {
    render(
      <Footer siteName="dev-theme" discordUrl="https://discord.gg/example" />,
    );

    expect(screen.getByRole("link", { name: /discord/i })).toHaveAttribute(
      "href",
      "https://discord.gg/example",
    );
  });

  it("omits the platform type when not provided", () => {
    render(<Footer siteName="dev-theme" />);

    expect(
      screen.queryByText("Minecraft: Java Edition"),
    ).not.toBeInTheDocument();
  });

  it("shows the platform type when provided", () => {
    render(
      <Footer siteName="dev-theme" platformType="Minecraft: Java Edition" />,
    );

    expect(screen.getByText("Minecraft: Java Edition")).toBeInTheDocument();
  });
});
