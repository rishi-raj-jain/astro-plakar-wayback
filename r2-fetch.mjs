// Minimal R2 fetch, used only by the container entrypoint to bootstrap the
// Kloset store from R2 on first boot. Downloads the store tarball object to a
// local file over the S3 API (aws4fetch, already a dependency). Exits non-zero
// if R2 is not configured or the object is missing, so the entrypoint falls back
// to an empty store. Usage: node r2-fetch.mjs <local-file>
import { AwsClient } from 'aws4fetch'
import { writeFileSync } from 'node:fs'

const file = process.argv[2]
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET = 'plakar-docs-archive', R2_OBJECT = 'kloset-store.tar.gz' } = process.env

if (!file) {
  console.error('usage: node r2-fetch.mjs <local-file>')
  process.exit(2)
}
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) process.exit(1) // not configured → empty store

const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, region: 'auto', service: 's3' })
const res = await client.fetch(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${R2_OBJECT}`)
if (!res.ok) process.exit(1) // 404 / error → empty store

writeFileSync(file, Buffer.from(await res.arrayBuffer()))
console.log(`fetched r2://${R2_BUCKET}/${R2_OBJECT} → ${file}`)
