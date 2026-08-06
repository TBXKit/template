import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PackageMedia } from "@/lib/tebex/types";
import { PackageGallery } from "./package-gallery";

const image = (url: string, primary = false): PackageMedia => ({
  type: "image",
  url,
  primary,
});

const video = (url: string, primary = false): PackageMedia => ({
  type: "video",
  url,
  primary,
});

describe("PackageGallery — single item", () => {
  it("renders a single image as the hero, with no grid below it", () => {
    const { container } = render(
      <PackageGallery media={[image("/hero.png")]} alt="A package" />,
    );

    expect(screen.getByRole("img", { name: "A package" })).toHaveAttribute(
      "src",
      expect.stringContaining("hero.png"),
    );
    expect(container.querySelector(".grid")).not.toBeInTheDocument();
  });
});

describe("PackageGallery — multiple items", () => {
  it("shows the primary item as the hero, even if it isn't first in the array", () => {
    const media = [image("/secondary.png"), image("/primary.png", true)];
    render(<PackageGallery media={media} alt="A package" />);

    const images = screen.getAllByRole("img", { name: "A package" });
    expect(images[0]).toHaveAttribute(
      "src",
      expect.stringContaining("primary.png"),
    );
  });

  it("falls back to the first item as the hero when none is flagged primary", () => {
    const media = [image("/first.png"), image("/second.png")];
    render(<PackageGallery media={media} alt="A package" />);

    const images = screen.getAllByRole("img", { name: "A package" });
    expect(images[0]).toHaveAttribute(
      "src",
      expect.stringContaining("first.png"),
    );
  });

  it("renders the remaining items below the hero", () => {
    const media = [
      image("/primary.png", true),
      image("/second.png"),
      image("/third.png"),
    ];
    render(<PackageGallery media={media} alt="A package" />);

    const images = screen.getAllByRole("img", { name: "A package" });
    expect(images).toHaveLength(3);
  });

  it("renders a video-type item with a native video element", () => {
    const media = [image("/primary.png", true), video("/clip.mp4")];
    const { container } = render(
      <PackageGallery media={media} alt="A package" />,
    );

    const videoEl = container.querySelector("video");
    expect(videoEl).toBeInTheDocument();
    expect(videoEl).toHaveAttribute("src", "/clip.mp4");
    expect(videoEl).toHaveAttribute("controls");
  });

  it("renders a video as the hero when it's the primary item", () => {
    const media = [image("/second.png"), video("/hero.mp4", true)];
    const { container } = render(
      <PackageGallery media={media} alt="A package" />,
    );

    const videoEl = container.querySelector("video");
    expect(videoEl).toHaveAttribute("src", "/hero.mp4");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});
