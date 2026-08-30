import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchForm } from "./search-form";

describe("SearchForm", () => {
  it("renders a labelled search input that submits a GET to /search", () => {
    const { container } = render(<SearchForm />);

    const input = screen.getByRole("searchbox", { name: "Search packages" });
    expect(input).toHaveAttribute("name", "q");

    const form = container.querySelector("form");
    expect(form).toHaveAttribute("action", "/search");
    // Default method is GET, so the query lands in the URL as ?q=...
    expect(form).not.toHaveAttribute("method", "post");
  });

  it("prefills the input from defaultValue (used to refine an existing query)", () => {
    render(<SearchForm defaultValue="diamond sword" />);

    expect(
      screen.getByRole("searchbox", { name: "Search packages" }),
    ).toHaveValue("diamond sword");
  });

  it("applies a caller-supplied className to the wrapper", () => {
    const { container } = render(<SearchForm className="w-64" />);

    expect(container.querySelector("search")).toHaveClass("w-64");
  });
});
