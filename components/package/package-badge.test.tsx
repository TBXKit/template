import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PackageType } from "@/lib/tebex/types";
import { PackageBadge } from "./package-badge";

describe("PackageBadge", () => {
  it.each<[PackageType, string]>([
    ["subscription", "Subscription"],
    ["single", "One-time purchase"],
  ])("maps the %s package type to its store-facing label", (type, label) => {
    render(<PackageBadge type={type} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("merges a caller-supplied className with its own", () => {
    const { container } = render(
      <PackageBadge type="single" className="ml-2" />,
    );

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("ml-2");
    // still keeps its own base styling
    expect(badge).toHaveClass("inline-flex");
  });
});
