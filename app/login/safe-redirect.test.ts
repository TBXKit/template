import { describe, expect, it } from "vitest";
import { isSafeRedirectPath } from "./safe-redirect";

describe("isSafeRedirectPath — accepts relative, same-origin paths", () => {
  it.each([
    "/",
    "/cart",
    "/package/123",
    "/search?q=test",
    "/a/b/c",
  ])("accepts %s", (path) => {
    expect(isSafeRedirectPath(path)).toBe(true);
  });
});

describe("isSafeRedirectPath — rejects off-site redirects", () => {
  it.each([
    ["https://evil.example", "absolute URL with a scheme"],
    [
      "http://evil.example/cart",
      "absolute URL disguised with a real-looking path",
    ],
    ["//evil.example", "protocol-relative URL"],
    ["javascript://evil.example", "javascript: pseudo-protocol containing //"],
    ["cart", "no leading slash"],
    ["", "empty string"],
  ])("rejects %s (%s)", (path) => {
    expect(isSafeRedirectPath(path)).toBe(false);
  });
});
