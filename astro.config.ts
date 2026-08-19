import node from '@astrojs/node'
import svelte from '@astrojs/svelte'
import { defineConfig, envField } from 'astro/config'

// Server-rendered. Retrieving an old version runs Plakar on the fly, and the
// action buttons execute real Plakar backups, so this needs a Node runtime with
// the plakar binary. Run with `npm run dev`, or built and served with `npm run start`.
export default defineConfig({
  output: 'server',
  integrations: [svelte()],
  adapter: node({ mode: 'standalone' }),
  redirects: { '/': '/docs/getting-started/installation/' },
  env: {
    schema: {
      // Path to the Kloset store. Defaults to ./.plakar/store when unset.
      PLAKAR_STORE: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Store passphrase. Defaults to the demo value when unset.
      PLAKAR_PASSPHRASE: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Current docs directory. Defaults to ./docs when unset.
      DOCS_DIR: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Label shown in the operations panel in place of the raw store path.
      PLAKAR_STORE_LABEL: envField.string({ context: 'server', access: 'public', default: '@nimbus-docs' }),
      // R2 bucket and object key for the store tarball.
      R2_BUCKET: envField.string({ context: 'server', access: 'public', default: 'plakar-docs-archive' }),
      R2_OBJECT: envField.string({ context: 'server', access: 'public', default: 'kloset-store.tar.gz' }),
      // R2 S3-API credentials for the backup push/pull (aws4fetch). When any is
      // unset the R2 sync is skipped; the store still persists on local disk.
      R2_ACCOUNT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      R2_ACCESS_KEY_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      R2_SECRET_ACCESS_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
})
