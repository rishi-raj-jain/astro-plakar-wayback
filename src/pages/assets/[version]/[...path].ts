export const prerender = false

import { getAssetBytes, getEntries, getVersion } from '@/lib/docs'
import { ensureRestored, entriesFor } from '@/lib/restore'
import type { APIRoute } from 'astro'
import { readFileSync } from 'node:fs'

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  avif: 'image/avif',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  csv: 'text/csv',
  json: 'application/json',
  css: 'text/css',
  zip: 'application/zip',
}

export const GET: APIRoute = async ({ params }) => {
  const version = getVersion(params.version!)
  if (!version) return new Response('Not found', { status: 404 })
  const assetSlug = params.path!

  let bytes: Buffer | null = null
  if (version.live) {
    bytes = getAssetBytes(version, assetSlug, getEntries(version))
  } else {
    // Read from the decrypted snapshot cache (restored once, then plain fs).
    // Look the slug up in the entries so a request can't escape the cache dir.
    const { dir } = await ensureRestored(version.id!)
    const asset = entriesFor(dir).assets.find((a) => a.slug === assetSlug)
    if (asset) bytes = readFileSync(asset.path)
  }
  if (!bytes) return new Response('Not found', { status: 404 })

  const ext = assetSlug.split('.').pop()?.toLowerCase() ?? ''
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
