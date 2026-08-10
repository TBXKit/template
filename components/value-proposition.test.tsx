import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValueProposition } from "./value-proposition";

describe("ValueProposition", () => {
  it("renders as obviously-placeholder content, not finished copy", () => {
    render(<ValueProposition />);

    expect(screen.getByText("[Why buy here?]")).toBeInTheDocument();
    expect(
      screen.getByText(/Reason one — e\.g\. Instant delivery/),
    ).toBeInTheDocument();
  });
});
