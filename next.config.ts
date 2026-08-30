import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Additive, not a replacement: `next build` still produces the normal
  // .next output `next start`/`npm run start` uses (see README's Deploying
  // section) — this only adds .next/standalone, a self-contained server
  // bundle with just the runtime dependencies Next.js actually traced, for
  // the Docker image to copy instead of the full node_modules. See Dockerfile.
  output: "standalone",
};

export default nextConfig;
