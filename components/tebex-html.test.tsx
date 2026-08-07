import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TebexHtml } from "./tebex-html";

// Uses the real isomorphic-dompurify, not a mock — the whole point of this
// component is the sanitization behavior, so exercising the actual library
// (it has no network calls or other reason to mock) is the only way to
// prove it works rather than just that it was called.

describe("TebexHtml — renders safe HTML", () => {
  it("renders HTML tags as real elements, not escaped text", () => {
    const { container } = render(
      <TebexHtml html="<p>Hello <strong>world</strong></p>" />,
    );

    expect(container.querySelector("strong")).toHaveTextContent("world");
    expect(container.querySelector("p")).toBeInTheDocument();
  });

  it("preserves a safe link's href", () => {
    const { container } = render(
      <TebexHtml html='<a href="https://example.com">link</a>' />,
    );

    expect(container.querySelector("a")).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("renders plain text (no tags) unchanged", () => {
    render(<TebexHtml html="Just plain text" />);

    expect(screen.getByText("Just plain text")).toBeInTheDocument();
  });
});

describe("TebexHtml — sanitization", () => {
  it("strips a script tag entirely", () => {
    const { container } = render(
      <TebexHtml html="<p>Safe</p><script>alert('xss')</script>" />,
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.getByText("Safe")).toBeInTheDocument();
  });

  it("strips an inline event-handler attribute", () => {
    const { container } = render(
      <TebexHtml html={'<img src="x.png" onerror="alert(1)">'} />,
    );

    const img = container.querySelector("img");
    expect(img).not.toHaveAttribute("onerror");
  });

  it("strips a javascript: URL from a link's href", () => {
    const { container } = render(
      <TebexHtml html={'<a href="javascript:alert(1)">click me</a>'} />,
    );

    // DOMPurify removes the href attribute entirely rather than leaving a
    // neutered value — either way, no javascript: URL should survive.
    const link = container.querySelector("a");
    expect(link?.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
  });
});

describe("TebexHtml — className", () => {
  it("applies the base prose classes with no className prop", () => {
    const { container } = render(<TebexHtml html="<p>Text</p>" />);

    expect(container.firstChild).toHaveClass("prose", "prose-sm");
  });

  it("merges a custom className alongside the base classes", () => {
    const { container } = render(
      <TebexHtml html="<p>Text</p>" className="mt-6 max-w-none" />,
    );

    expect(container.firstChild).toHaveClass(
      "prose",
      "prose-sm",
      "mt-6",
      "max-w-none",
    );
  });
});

describe("TebexHtml — size", () => {
  it('defaults to the "sm" prose size variant', () => {
    const { container } = render(<TebexHtml html="<p>Text</p>" />);

    expect(container.firstChild).toHaveClass("prose-sm");
    expect(container.firstChild).not.toHaveClass("prose-lg");
  });

  it('uses the "lg" prose size variant when requested, not both at once', () => {
    const { container } = render(<TebexHtml html="<p>Text</p>" size="lg" />);

    expect(container.firstChild).toHaveClass("prose-lg");
    expect(container.firstChild).not.toHaveClass("prose-sm");
  });
});
