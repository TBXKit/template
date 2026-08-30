import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `.next/standalone` — a self-contained server bundle with only the traced
  // runtime deps — is what the Docker image copies instead of the full
  // node_modules (see Dockerfile). Nothing else needs it: `next start` and
  // every managed host (Vercel included) use the normal `.next` output.
  //
  // Off by default, opt in via BUILD_STANDALONE — the Dockerfile sets it.
  // Not the reverse (on by default, off on Vercel): with Turbopack builds
  // (the Next 16 default) + `output: "standalone"`, Vercel's post-build
  // packaging fails with `ENOENT .next/next-server.js.nft.json` even though
  // the build succeeds (known Next 16.3.x issue), and detecting Vercel via
  // its `VERCEL` env var is unreliable — that var is only exposed when
  // "system environment variables" is enabled in project settings
  // (https://vercel.com/docs/environment-variables/system-environment-variables).
  // An explicit opt-in the Docker build controls has no such hole.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  // Silence the per-request `GET /path 200 in Xms` line in `next dev` (and
  // the e2e build). This is a dev-only Next.js feature — it has no effect on
  // production output — but it removes a lot of local console noise. App
  // logging goes through lib/logger.ts; see AGENTS.md → Logging.
  logging: { incomingRequests: false },
};

export default nextConfig;
