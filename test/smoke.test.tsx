import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { PackageType } from "@/lib/tebex/types";

/**
 * Infrastructure-only test: proves Vitest, TypeScript, the `@/` path alias,
 * jsdom, and React Testing Library are wired up correctly. Not a test of
 * application behavior — see AGENTS.md for where real coverage belongs.
 */
function Placeholder({ status }: { status: PackageType }) {
  return <p>Test environment ready ({status})</p>;
}

test("Vitest, jsdom, and React Testing Library are configured correctly", () => {
  render(<Placeholder status="single" />);

  expect(
    screen.getByText("Test environment ready (single)"),
  ).toBeInTheDocument();
});
