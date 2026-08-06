import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Package, PackageMedia } from "@/lib/tebex/types";
import { PackageDetail } from "./package-detail";

// Covers the gallery/media rendering that used to be tested in isolation via
// PackageGallery, back when it was its own exported component. It's now a
// private helper inside package-detail.tsx, so its behavior is exercised
// here through PackageDetail's public rendering instead.

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

function makePackage(media: PackageMedia[]): Package {
  return {
    id: 1,
    name: "A package",
    description: "",
    image: null,
    media,
    type: "single",
    base_price: 10,
    discount: 0,
    total_price: 10,
    expiration_date: null,
    category: { id: 1, name: "Category" },
    variables: [],
    disable_quantity: false,
    disable_gifting: false,
  };
}

describe("PackageDetail — gallery, single item", () => {
  it("renders a single image as the hero, with no thumbnail grid below it", () => {
    const { container } = render(
      <PackageDetail pkg={makePackage([image("/hero.png")])} currency="USD" />,
    );

    expect(screen.getByRole("img", { name: "A package" })).toHaveAttribute(
      "src",
      expect.stringContaining("hero.png"),
    );
    expect(container.querySelector(".grid-cols-3")).not.toBeInTheDocument();
  });
});

describe("PackageDetail — gallery, multiple items", () => {
  it("shows the primary item as the hero, even if it isn't first in the array", () => {
    const media = [image("/secondary.png"), image("/primary.png", true)];
    render(<PackageDetail pkg={makePackage(media)} currency="USD" />);

    const images = screen.getAllByRole("img", { name: "A package" });
    expect(images[0]).toHaveAttribute(
      "src",
      expect.stringContaining("primary.png"),
    );
  });

  it("falls back to the first item as the hero when none is flagged primary", () => {
    const media = [image("/first.png"), image("/second.png")];
    render(<PackageDetail pkg={makePackage(media)} currency="USD" />);

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
    render(<PackageDetail pkg={makePackage(media)} currency="USD" />);

    const images = screen.getAllByRole("img", { name: "A package" });
    expect(images).toHaveLength(3);
  });

  it("renders a video-type item with a native video element", () => {
    const media = [image("/primary.png", true), video("/clip.mp4")];
    const { container } = render(
      <PackageDetail pkg={makePackage(media)} currency="USD" />,
    );

    const videoEl = container.querySelector("video");
    expect(videoEl).toBeInTheDocument();
    expect(videoEl).toHaveAttribute("src", "/clip.mp4");
    expect(videoEl).toHaveAttribute("controls");
  });

  it("renders a video as the hero when it's the primary item", () => {
    const media = [image("/second.png"), video("/hero.mp4", true)];
    const { container } = render(
      <PackageDetail pkg={makePackage(media)} currency="USD" />,
    );

    const videoEl = container.querySelector("video");
    expect(videoEl).toHaveAttribute("src", "/hero.mp4");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});

describe("PackageDetail — no media", () => {
  it("falls back to pkg.image when pkg.media is empty", () => {
    const pkg = { ...makePackage([]), image: "/fallback.png" };
    render(<PackageDetail pkg={pkg} currency="USD" />);

    expect(screen.getByRole("img", { name: "A package" })).toHaveAttribute(
      "src",
      expect.stringContaining("fallback.png"),
    );
  });
});
