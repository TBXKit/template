# Contributing

## Architecture is spec'd, not folklore

[`AGENTS.md`](AGENTS.md) is the architectural authority for this repo — for
human contributors and AI agents alike. Read **Core Philosophy** and
**Decision Procedures** before proposing structural changes (new components,
Context, `useEffect`, Route Handlers). It exists so two people arrive at the
same decision from the same facts without re-litigating past PRs.

Anything it prohibits has an **Exception Process** — agreed with a maintainer
*before* the crossing code is written, not justified in a comment afterward.

## Setup

```bash
npm install
cp .env.example .env.local   # set TEBEX_PUBLIC_TOKEN
npm run dev
```

## Before opening a PR

| Command | Must be |
|---|---|
| `npm run lint` | clean (Biome — lint + format) |
| `npm run typecheck` | clean (`next typegen` + `tsc --noEmit`; no token needed) |
| `npm run test` | green (Vitest unit suite) |

CI runs the same three on every push and PR. `npm run format` applies Biome's
fixes.

`npm run test:e2e` (Playwright, against a fixture Tebex server — no token or
network needed; run `npx playwright install chromium` once first) covers the
route layer and real-browser accessibility. It isn't in CI yet but should pass
locally before a change to routing, data flow, or a live region.

## Conventions

- **Tests live beside the code** they cover (`foo.test.ts` next to `foo.ts`).
  `test/` is cross-cutting setup only. No coverage threshold — add tests with
  the behavior they pin, not to chase a number.
- **A change that sets or relies on an ARIA role, a live region, or focus
  behavior** is not done on a green jsdom run alone — verify it once against a
  real browser's accessibility tree (see `AGENTS.md` → Testing Requirements).
- **Markdown is git-ignored by default** (`.gitignore`'s `*.md`) to keep
  agent-generated scratch files out. Intentional docs are allow-listed by
  exact name — add a `!/your-doc.md` line if you're adding one.
- **`next dev` rewrites the agent block at the top of `AGENTS.md`.** Commit
  that change together with your work so the tree stays clean; don't fight it
  in review.
- Commit messages: short imperative subject ("Add X", "Fix Y"), like the
  existing history.

## What's intentionally out of scope

Purchase history, multi-currency/locale switching, Route Handlers, middleware,
a database, and an admin/CMS layer are all deliberate non-goals — see
`AGENTS.md` and the README. Propose them through the Exception Process, not as
a surprise in a PR.
