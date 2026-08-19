#!/bin/sh
# Prepare the persistent volume, then start the Astro server.
#
# The image bakes the starting docs (/app/seed/docs) and the pre-built v1…v5
# Kloset store (/app/seed/store), stamped with /app/seed/SEED_VERSION. The volume
# is (re)seeded when it has no store yet, or when the image's SEED_VERSION differs
# from the one recorded on the volume. Bumping SEED_VERSION in the Dockerfile
# reinstalls the canonical history on the next deploy. Otherwise the volume is the
# source of truth, so versions created from the UI survive restarts and redeploys.
set -e

DATA="${DATA_DIR:-/data}"

BAKED_VER="$(cat /app/seed/SEED_VERSION 2>/dev/null || echo none)"
CUR_VER="$(cat "$DATA/SEED_VERSION" 2>/dev/null || echo none)"

if [ ! -f "$DATA/store/CONFIG" ] || [ "$BAKED_VER" != "$CUR_VER" ]; then
  echo "Seeding $DATA (image seed=$BAKED_VER, volume seed=$CUR_VER) …"
  rm -rf "$DATA/store" "$DATA/docs"
  cp -a /app/seed/docs "$DATA/docs"
  # Prefer the v1…v5 history baked into the image. Fall back to an offsite copy
  # in R2 (built and pushed from a laptop), then to an empty store. The R2 tarball
  # has a top-level store/ dir, so extracting into $DATA lands it at $DATA/store.
  if [ -f /app/seed/store/CONFIG ]; then
    echo "Installing the baked v1…v5 history …"
    cp -a /app/seed/store "$DATA/store"
    # Per-snapshot dedup figures, read by the app from next to the store.
    cp /app/seed/snapshot-stats.json "$DATA/snapshot-stats.json" 2>/dev/null || true
  elif node /app/r2-fetch.mjs /tmp/store.tar.gz; then
    echo "Restoring store from R2 …"
    tar -C "$DATA" -xzf /tmp/store.tar.gz
    rm -f /tmp/store.tar.gz
  else
    echo "No baked or R2 store available, creating an empty store."
    mkdir -p "$DATA/store"
    PLAKAR_PASSPHRASE="${PLAKAR_PASSPHRASE:-wayback-demo}" plakar at "$DATA/store" create
  fi
  echo "$BAKED_VER" > "$DATA/SEED_VERSION"
fi

# Point the app at the volume copies. The R2 push packs from these paths
# directly, so no ./.plakar symlink is needed.
export PLAKAR_STORE="$DATA/store"
export DOCS_DIR="$DATA/docs"

echo "Serving: PLAKAR_STORE=$PLAKAR_STORE DOCS_DIR=$DOCS_DIR HOST=$HOST PORT=$PORT"
exec node ./dist/server/entry.mjs
