#!/bin/sh
# Prepare the persistent volume, then start the Astro server.
#
# The image bakes the starting docs at /app/seed/docs. On the FIRST boot the
# mounted volume (/data) is empty, so we copy the docs onto it and create an
# empty Plakar store. After that the volume is the source of truth, so backups
# and new versions created from the UI survive restarts and redeploys.
set -e

DATA="${DATA_DIR:-/data}"

if [ ! -f "$DATA/store/CONFIG" ]; then
  echo "First boot: initializing $DATA …"
  cp -a /app/seed/docs "$DATA/docs"
  # Bootstrap the store from R2 if an offsite copy exists (built and pushed from
  # a laptop); otherwise start empty. The tarball has a top-level store/ dir, so
  # extracting into $DATA lands it at $DATA/store.
  if node /app/r2-fetch.mjs /tmp/store.tar.gz; then
    echo "Restoring store from R2 …"
    tar -C "$DATA" -xzf /tmp/store.tar.gz
    rm -f /tmp/store.tar.gz
  else
    echo "No R2 store available, creating an empty store."
    mkdir -p "$DATA/store"
    PLAKAR_PASSPHRASE="${PLAKAR_PASSPHRASE:-wayback-demo}" plakar at "$DATA/store" create
  fi
fi

# Point the app at the volume copies. The R2 push packs from these paths
# directly, so no ./.plakar symlink is needed.
export PLAKAR_STORE="$DATA/store"
export DOCS_DIR="$DATA/docs"

echo "Serving: PLAKAR_STORE=$PLAKAR_STORE DOCS_DIR=$DOCS_DIR HOST=$HOST PORT=$PORT"
exec node ./dist/server/entry.mjs
