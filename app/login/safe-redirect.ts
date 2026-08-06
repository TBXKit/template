/**
 * A relative, same-origin path only — never an absolute URL. `next` comes
 * from a query string an attacker could craft (e.g. a link to
 * `/login?next=https://evil.example`), so this guards against redirecting a
 * visitor off-site after they've just entered their username. A plain
 * helper, not a Server Action — `login-action.ts`'s `"use server"` file can
 * only export async Server Actions, so this can't live there.
 */
export function isSafeRedirectPath(path: string): boolean {
  return (
    path.startsWith("/") && !path.startsWith("//") && !path.includes("://")
  );
}
