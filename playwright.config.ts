import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run the real app against a local fixture Tebex server
// (test/e2e/fixture-server.mjs) — no secret, no network, deterministic. They
// cover the async Server Component route layer that Vitest can't render, and
// are the place to verify ARIA roles / live regions / focus in a real
// browser (see AGENTS.md → Testing Requirements).
//
// Not wired into CI yet; run locally with `npm run test:e2e`. The app server
// is a production build (`next build` + `next start`), not `next dev` — a
// smoke suite against a dev server flakes on first-hit route compilation.

const APP_PORT = 3100;
const FIXTURE_PORT = 4599;
const TEBEX_ENV = {
  TEBEX_API_BASE: `http://127.0.0.1:${FIXTURE_PORT}/api`,
  TEBEX_PUBLIC_TOKEN: "e2e-fixture-token",
  SITE_URL: `http://127.0.0.1:${APP_PORT}`,
};

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node test/e2e/fixture-server.mjs",
      port: FIXTURE_PORT,
      reuseExistingServer: false,
      env: { FIXTURE_PORT: String(FIXTURE_PORT) },
    },
    {
      // Build needs the fixture up (sitemap.ts / opengraph-image.tsx fetch at
      // build time) — Playwright starts webServers in order and waits for the
      // fixture's port first. `next start` prints a harmless "does not work
      // with output: standalone" warning here (see README → Deploying); the
      // app serves normally either way.
      command: `npm run build && npx next start --port ${APP_PORT}`,
      port: APP_PORT,
      reuseExistingServer: false,
      timeout: 180_000,
      env: TEBEX_ENV,
    },
  ],
});
