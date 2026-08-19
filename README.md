# Nimbus Docs, a Wayback Machine for documentation, powered by Plakar + R2

Browse a documentation site at any point in its history, securely and on-demand.

Every past version is a [Plakar](https://www.plakar.io) encrypted snapshot remotely secured in Cloudflare R2.

On-demand, the backend retrieves a given version from the backup, including its pages, images, PDFs, CSV/JSON references, and stylesheet.

## Backups and R2

Click **Create new version** to back up the current docs as a saved version, mutate them into the next one, and — if R2 is configured — automatically upload a tarball of the store.

![Back up on Fly, snapshot with Plakar, then PUT/GET the store tarball on Cloudflare R2](diagram-flowchart.png)

## Quick start

You need Node 22+ and `plakar` 1.1.0+. Once they are installed, run the following commands:

```bash
npm install
cp .env.example .env
npm run seed        # builds the v1…v5 history into ./.plakar/store
npm run dev
```

`npm run seed` runs [seed/index.mjs](seed/index.mjs): it wipes the Kloset store, then snapshots `seed/versions/v1`…`seed/versions/v4` as past versions and leaves `seed/versions/v5` in `src/docs` as the live current version.

## Demo content

The docs are a fictional CLI, **Nimbus**, documented across five releases. Every version has the **same file paths** but different content, images, CSS, and embeds, so browsing v1 → v5 shows a documentation site evolving:

- **v1** (0.1 beta) — minimal, plain serif theme, basic shell examples.
- **v2** (0.5) — config file + auth, teal theme, an embedded PDF spec sheet.
- **v3** (1.0 GA) — REST API + SDKs, indigo theme, an embedded intro video.
- **v4** (1.5) — plugins + observability, dark code theme, a tweet testimonial.
- **v5** (2.0, current) — edge functions + teams, violet theme, callouts, tables, and every embed.

Each version's source lives in `seed/versions/v1`…`seed/versions/v5`. Edit those and re-run `npm run seed` to rebuild the history.

> The embedded YouTube clip is a guaranteed-embeddable placeholder — swap in a real product video. The "tweet" is a self-contained styled card (not the live Twitter embed, whose script cannot run through the server-rendered markdown pipeline).

To build and serve in production:

```bash
npm run build
npm run start
```

## R2

The app pushes the store to R2 automatically after each backup, over R2's S3 API.
Set an R2 API token in the env to enable it (create one in the Cloudflare
dashboard → R2 → Manage API Tokens):

## Deploy

The app runs `plakar` as a subprocess, so it needs a long-lived Node process and a disk. The [Dockerfile](Dockerfile) installs the binary. [fly.toml](fly.toml) mounts a volume at `/data`.

```bash
# set `app` in fly.toml to a unique name
fly apps create <name>
fly volumes create plakar_data --region iad --size 1
fly deploy
fly open
```

The image bakes the pre-built v1…v5 history (the Dockerfile runs `npm run seed` during the build). On boot the entrypoint installs it onto the volume when the volume is empty, or when the image's `SEED_VERSION` differs from the one recorded on the volume — so bumping `SEED_VERSION` in the [Dockerfile](Dockerfile) reinstalls the canonical history on the next deploy. Otherwise the volume persists, so versions created from the UI survive restarts and redeploys. (If no baked store is present it falls back to restoring from R2, then to an empty store.)

```bash
fly secrets set R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=…
```

Set `PLAKAR_PASSPHRASE` as a Fly secret before the first deploy unless `wayback-demo` is fine. A new passphrase cannot open the old store. Destroy the volume if you need to start over.

## Credits

All sample documentation images — in `seed/versions/**/images` and the live `src/docs/**/images` — are photos from [Unsplash](https://unsplash.com), used under the [Unsplash License](https://unsplash.com/license). Each version uses a different set. The tweet-card avatars are Unsplash portraits under the same license.
