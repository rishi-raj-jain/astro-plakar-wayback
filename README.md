# Nimbus Docs, a Wayback Machine for documentation, powered by Plakar + R2

Browse a documentation site at any point in its history, securely and on-demand.

Every past version is a [Plakar](https://www.plakar.io) encrypted snapshot remotely secured in Cloudflare R2.

On-demand, the backend retrieves a given version from the backup, including its pages, images, PDFs, CSV/JSON references, and stylesheet.

## Backups and R2

Click **Back up** to run `plakar` on the Fly.io volume and, if R2 is configured, automatically upload a tarball of the store. On first boot an empty machine downloads that tarball.

![Back up on Fly, snapshot with Plakar, then PUT/GET the store tarball on Cloudflare R2](diagram-flowchart.png)

## Quick start

You need Node 22+ and `plakar` 1.1.0+. Once they are installed, run the following commands:

```bash
npm install
cp .env.example .env
PLAKAR_PASSPHRASE=wayback-demo plakar at ./.plakar/store create
npm run dev
```

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

On first boot Fly copies `src/docs` onto the volume. If R2 has a tarball, it restores the store from that; if not, it creates an empty store. Later deploys keep using the volume.

```bash
fly secrets set R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=…
```

Set `PLAKAR_PASSPHRASE` as a Fly secret before the first deploy unless `wayback-demo` is fine. A new passphrase cannot open the old store. Destroy the volume if you need to start over.
