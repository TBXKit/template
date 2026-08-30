import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoreDisabledBanner } from "./store-disabled-banner";

describe("StoreDisabledBanner", () => {
  it("explains the store is closed for purchases but still browsable", () => {
    render(<StoreDisabledBanner />);

    expect(
      screen.getByText(/currently unavailable for purchases/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/still browse categories and packages/i),
    ).toBeInTheDocument();
  });
});
