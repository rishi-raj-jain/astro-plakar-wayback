# syntax=docker/dockerfile:1

# ─── builder ───────────────────────────────────────────────────────────────
# Installs the plakar CLI (the binary is copied into the runtime image) and
# builds the Astro server. The current docs live in src/docs.
FROM node:22-slim AS builder
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl tar \
  && rm -rf /var/lib/apt/lists/*

# Pinned plakar CLI, Linux amd64 (verified against v1.1.0). Extract just the binary.
ARG PLAKAR_VERSION=1.1.0
RUN curl -fsSL "https://github.com/PlakarKorp/plakar/releases/download/v${PLAKAR_VERSION}/plakar_${PLAKAR_VERSION}_linux_amd64.tar.gz" \
    | tar -xz -C /usr/local/bin plakar \
  && plakar version

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Build the v1…v5 demo history into the Kloset store so the image ships with it
# (seed/index.mjs snapshots seed/versions/v1…v4 and leaves v5 in src/docs). Uses
# the default passphrase, matching the runtime default.
RUN PLAKAR_PASSPHRASE=wayback-demo npm run seed

# ─── runtime ───────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATA_DIR=/data

# plakar is needed at request time too (ls / locate / cat, backup, check). tar is
# used by the optional R2 push.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tar \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/bin/plakar /usr/local/bin/plakar

# Production dependencies only.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The built server, the starting docs (v5), and the pre-built v1…v5 store, both
# copied onto the volume on first boot.
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/src/docs ./seed/docs
COPY --from=builder /build/.plakar/store ./seed/store
# Per-snapshot dedup figures the seed recorded (the store can't reconstruct them).
COPY --from=builder /build/.plakar/snapshot-stats.json ./seed/snapshot-stats.json
# The R2 fetch helper the entrypoint uses to bootstrap the store from R2.
COPY --from=builder /build/r2-fetch.mjs ./r2-fetch.mjs

# Bump SEED_VERSION to force the entrypoint to reinstall the baked history over
# an existing volume on the next deploy (otherwise the volume persists as-is).
ARG SEED_VERSION=4
RUN echo "$SEED_VERSION" > ./seed/SEED_VERSION

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]
