import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlayerAvatar } from "./player-avatar";

describe("PlayerAvatar — Minecraft stores", () => {
  it("renders an avatar sourced from the username for Java Edition", () => {
    // alt="" gives the image an implicit "presentation" role, not "img", so
    // it's queried directly rather than via getByRole — same reasoning as
    // header.test.tsx's own webstore-logo image.
    const { container } = render(
      <PlayerAvatar username="Notch" platformType="Minecraft: Java Edition" />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("mc-heads.net/avatar/Notch"),
    );
  });

  it('renders for Bedrock Edition too (platform_type still contains "Minecraft")', () => {
    const { container } = render(
      <PlayerAvatar
        username="Notch"
        platformType="Minecraft: Bedrock Edition"
      />,
    );

    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("URL-encodes a username with special characters", () => {
    const { container } = render(
      <PlayerAvatar username="a b" platformType="Minecraft: Java Edition" />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("mc-heads.net/avatar/a%20b"),
    );
  });

  it("is decorative (empty alt text) since the username is always shown as adjacent text", () => {
    const { container } = render(
      <PlayerAvatar username="Notch" platformType="Minecraft: Java Edition" />,
    );

    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});

describe("PlayerAvatar — non-Minecraft stores", () => {
  it("renders nothing for Steam", () => {
    const { container } = render(
      <PlayerAvatar username="Notch" platformType="Steam" />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("renders nothing for FiveM", () => {
    const { container } = render(
      <PlayerAvatar username="Notch" platformType="FiveM" />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});
