// Talks to Cloudflare R2 over its S3-compatible API, signed with aws4fetch. This
// replaces the wrangler CLI: no subprocess, no interactive login, just a signed
// HTTP PUT/GET, which is what actually works inside a container. The store
// tarball is pushed here after a backup and can be pulled back to restore.
//
// Configure with an R2 API token (Account ID + Access Key ID + Secret Access
// Key). When any is missing, r2Configured() is false and callers skip the sync.

import { R2_ACCESS_KEY_ID, R2_ACCOUNT_ID, R2_BUCKET, R2_OBJECT, R2_SECRET_ACCESS_KEY } from 'astro:env/server'
import { AwsClient } from 'aws4fetch'

/** True when R2 S3 credentials are present. */
export function r2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)
}

function client(): AwsClient {
  return new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY!, region: 'auto', service: 's3' })
}

function objectUrl(key: string): string {
  return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`
}

/** Upload bytes to the bucket (defaults to the store object key). */
export async function putObject(body: Uint8Array, key: string = R2_OBJECT): Promise<void> {
  const res = await client().fetch(objectUrl(key), {
    method: 'PUT',
    body,
    headers: { 'content-type': 'application/gzip' },
  })
  if (!res.ok) throw new Error(`R2 PUT ${res.status} ${res.statusText}`)
}
