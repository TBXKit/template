import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Additive, not a replacement: `next build` still produces the normal
  // .next output `next start`/`npm run start` uses (see README's Deploying
  // section) — this only adds .next/standalone, a self-contained server
  // bundle with just the runtime dependencies Next.js actually traced, for
  // the Docker image to copy instead of the full node_modules. See Dockerfile.
  output: "standalone",
  // Silence the per-request `GET /path 200 in Xms` line in `next dev` (and
  // the e2e build). This is a dev-only Next.js feature — it has no effect on
  // production output — but it removes a lot of local console noise. App
  // logging goes through lib/logger.ts; see AGENTS.md → Logging.
  logging: { incomingRequests: false },
};

export default nextConfig;
