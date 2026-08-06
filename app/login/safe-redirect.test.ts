import { describe, expect, it } from "vitest";
import { isSafeRedirectPath } from "./safe-redirect";

describe("isSafeRedirectPath — accepts relative, same-origin paths", () => {
  it.each([
    "/",
    "/cart",
    "/package/123",
    "/search?q=test",
    "/a/b/c",
    // A same-origin path containing "://" later on (e.g. in a query value)
    // is still safe — the leading-slash rules alone rule out an actual
    // absolute URL, since no scheme starts with "/". This must not be
    // rejected just because the substring "://" appears somewhere in it.
    "/search?ref=https://example.com",
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
    [
      "/\\evil.example",
      "leading backslash — browsers resolve \\ as / for special schemes, making this equivalent to //evil.example",
    ],
    ["/\\/evil.example", "backslash followed by a slash"],
    [
      "/a/b\\evil.example",
      "backslash appearing later in an otherwise-safe-looking path",
    ],
  ])("rejects %s (%s)", (path) => {
    expect(isSafeRedirectPath(path)).toBe(false);
  });
});
