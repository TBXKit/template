# Security

## Reporting a vulnerability

Report suspected vulnerabilities privately via GitHub's **Report a
vulnerability** button (Security tab → Advisories) on this repository, or by
opening a minimal private channel with the maintainer — **not** as a public
issue or PR. Please include repro steps and affected versions.

## Scope

This is a storefront template. The security-relevant surface is small by
design:

- **`TEBEX_PUBLIC_TOKEN`** is Tebex's *public*, storefront-scoped token. It is
  meant to be used server-side and is not a secret in the way a password or an
  API secret key is — but it identifies your store's account, so keep it in
  `.env.local` / your host's env, not in a committed file. This app holds **no**
  private secret key: Tebex's Plugin API (purchase history, private
  `X-Tebex-Secret` auth) is deliberately not integrated.
- **Basket idents** are bearer credentials (session-cookie trust level). They
  live in an `HttpOnly` cookie and are never logged in full — `lib/logger.ts`
  exports `redactBasketIdent` for anywhere one would otherwise appear.
- **No Route Handlers, middleware, or webhook endpoints exist** (see
  `AGENTS.md` → Non-Negotiable Constraints), so there is no custom
  request-handling layer to attack; all server logic runs through page renders
  and Server Actions.
- **Tebex-authored HTML** (package/category/store descriptions) is sanitized
  with DOMPurify in `components/tebex-html.tsx` before rendering.
- **The `?next=` login redirect** is constrained to same-origin relative paths
  by `app/login/safe-redirect.ts` to prevent open redirects.

## Supported versions

This template is meant to be forked. Fixes land on `main`; there is no
back-port branch. Track `main` (or a tag) and re-apply changes into your fork.
