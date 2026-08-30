# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app

# ---- deps: install once, cached across builds unless package.json/lockfile change ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: full source + devDependencies, needed to run `next build` ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# app/sitemap.ts and app/opengraph-image.tsx are statically generated at
# build time (they don't call cookies(), so Next.js has no signal to treat
# them as dynamic — see AGENTS.md's "Dynamic-rendering trade-off"), and both
# fetch live Tebex data. That means `next build` itself needs
# TEBEX_PUBLIC_TOKEN, not just the running container — this is an existing
# property of the app (same as `npm run build` locally), not something this
# Dockerfile introduces. Passed as a BuildKit secret so it's available to
# this RUN step only and never lands in an image layer:
#   docker build --secret id=tebex_public_token,env=TEBEX_PUBLIC_TOKEN .
#
# SITE_URL is baked into sitemap.xml/robots.txt at this same build step —
# pass the real deployed URL via --build-arg SITE_URL=... or the generated
# files will point at the http://localhost:3000 fallback. Not a secret, so
# it's a plain ARG rather than a mounted one.
ARG SITE_URL
ENV SITE_URL=${SITE_URL}
# Opt into `output: "standalone"` (see next.config.ts) — this is the only
# build that wants it; the runner stage below copies .next/standalone.
ENV BUILD_STANDALONE=1
RUN --mount=type=secret,id=tebex_public_token \
    TEBEX_PUBLIC_TOKEN="$(cat /run/secrets/tebex_public_token)" npm run build

# ---- runner: minimal production image ----
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# node:alpine already ships a non-root "node" user/group — reused rather
# than creating a new one.
#
# No public/ directory exists in this template today — the store logo and
# favicon come from the Tebex account via getWebstore(), not static files
# (see README's Theming section). If a fork adds one, also add:
#   COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

# "/" already requires a successful Tebex fetch to render (the root layout
# calls getWebstore()/getCategories() — see AGENTS.md), so it doubles as a
# real liveness check without a dedicated endpoint. This app deliberately
# has no Route Handlers (AGENTS.md's Non-Negotiable Constraints), so adding
# a /api/health route isn't a casual option here. node's built-in fetch
# avoids installing curl/wget into the runtime image just for this check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Runtime configuration (TEBEX_PUBLIC_TOKEN, SITE_URL, DISCORD_URL) comes
# from the environment at `docker run`/Compose time — see README. None of
# it is set here.
CMD ["node", "server.js"]
