/**
 * A relative, same-origin path only — never an absolute URL. `next` comes
 * from a query string an attacker could craft (e.g. a link to
 * `/login?next=https://evil.example`), so this guards against redirecting a
 * visitor off-site after they've just entered their username. A plain
 * helper, not a Server Action — `login-action.ts`'s `"use server"` file can
 * only export async Server Actions, so this can't live there.
 *
 * Requiring a single leading `/` (and rejecting a second one, `//...`,
 * which browsers treat as protocol-relative) already rules out every
 * scheme-based absolute URL on its own — no scheme starts with `/`. There
 * is deliberately no separate `!path.includes("://")` check: that would be
 * redundant against the same attack (already blocked by the leading-slash
 * rules above) while incorrectly rejecting a legitimate same-origin path
 * that merely contains `://` later on, e.g. `/search?ref=https://x.com`.
 *
 * Rejects any backslash (e.g. `/\evil.example`) for a similar reason —
 * browsers treat `\` the same as `/` when resolving a URL's authority for
 * special schemes (http/https) per the WHATWG URL Standard, so
 * `/\evil.example` would otherwise resolve as the protocol-relative
 * `//evil.example` and redirect off-site, bypassing the `//` check above.
 */
export function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}
