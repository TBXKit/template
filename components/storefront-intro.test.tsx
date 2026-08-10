import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StorefrontIntro } from "./storefront-intro";

describe("StorefrontIntro", () => {
  it("includes the store name in its placeholder copy", () => {
    render(<StorefrontIntro storeName="Ranks & Cosmetics" />);

    expect(screen.getByText(/Ranks & Cosmetics/)).toBeInTheDocument();
  });
});
