// Streams the retrieval of one archived page as NDJSON, filling the terminal on
// the archive page row by row in real time. The heavy lifting is a single
// `plakar restore` that decrypts the whole snapshot once (cached per machine
// lifetime). After that the page, stylesheet and images are plain fs reads, so
// repeat views and every image load are instant. When done it sends the rendered
// article + theme, then the totals.
//
// Events (one JSON object per line):
//   { type: 'op',      op: { command, detail, ms, bytes } }
//   { type: 'meta',    label, id, stamp, versions: [...] }
//   { type: 'store',   info: {...}, diffHref, diffLabel }
//   { type: 'content', title, html, theme, referenced: [...], allFiles: [...] }
//   { type: 'done',    totals: { count, ms, bytes } }
//   { type: 'error',   message }

export const prerender = false

import { buildVersions, getNav, renderDoc, switcherChips, THEME_SLUG } from '@/lib/docs'
import { Ops, type Op } from '@/lib/ops'
import { listSnapshotsAsync, storeInfo, STORE_LABEL } from '@/lib/plakar'
import { ensureRestored, entriesFor } from '@/lib/restore'
import type { APIRoute } from 'astro'
import matter from 'gray-matter'
import { readFileSync } from 'node:fs'

export const GET: APIRoute = ({ params }) => {
  const versionKey = params.version!
  const slug = (params.slug ?? '').replace(/\/$/, '')
  const enc = new TextEncoder()
  const ops = new Ops()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + '\n'))
      const sendOp = (op: Op) => {
        ops.entries.push(op)
        send({ type: 'op', op })
      }
      const fail = (message: string) => {
        send({ type: 'error', message })
        controller.close()
      }
      // Read a restored file from disk and record it as a timed op row.
      const readAndSend = (relPath: string, absPath: string, binary: boolean) => {
        const start = performance.now()
        const data = binary ? readFileSync(absPath) : readFileSync(absPath, 'utf8')
        const ms = Math.max(1, Math.round(performance.now() - start))
        const bytes = binary ? (data as Buffer).length : Buffer.byteLength(data as string)
        sendOp({ command: `read ${relPath}`, detail: binary ? 'binary' : 'text', ms, bytes })
        return data
      }

      try {
        // 1. List snapshots, and resolve which version this URL points at.
        const { snapshots, op: lsOp } = await listSnapshotsAsync(ops)
        send({ type: 'op', op: lsOp })
        const versions = buildVersions(snapshots)
        const version = versions.find((v) => v.key === versionKey)
        if (!version || version.live) return fail('This version was not found in the backup.')

        // The next older snapshot, so the page can link to "what changed since then".
        const snapVersions = versions.filter((v) => !v.live) // newest → oldest
        const selfIdx = snapVersions.findIndex((v) => v.key === versionKey)
        const prev = selfIdx >= 0 && selfIdx < snapVersions.length - 1 ? snapVersions[selfIdx + 1] : null

        // Enough to fill the heading and the version switcher.
        send({
          type: 'meta',
          label: version.label,
          id: version.id,
          stamp: version.date.toISOString().replace('T', ' ').slice(0, 19),
          versions: switcherChips(versions, slug, versionKey),
          diffHref: prev ? `/diff/${prev.key}/${versionKey}` : null,
          prevLabel: prev?.label ?? null,
        })

        // The encrypted-store facts panel (same store-wide numbers every version
        // sees), plus a link to the latest saved change set.
        const latest = snapVersions.length >= 2 ? { from: snapVersions[1], to: snapVersions[0] } : null
        send({
          type: 'store',
          info: storeInfo(),
          diffHref: latest ? `/diff/${latest.from.key}/${latest.to.key}` : null,
          diffLabel: latest ? `${latest.from.label} → ${latest.to.label}` : null,
        })

        // 2. Decrypt the whole snapshot once (or reuse the cached plaintext).
        const short = version.id!.slice(0, 8)
        const r = await ensureRestored(version.id!)
        sendOp({
          command: `plakar at ${STORE_LABEL} restore ${short}`,
          detail: r.cached ? 'reused decrypted cache' : `decrypted ${r.files} files`,
          ms: r.ms,
          bytes: r.bytes,
        })

        // 3. Everything below is a plain fs read from the decrypted snapshot.
        const entries = entriesFor(r.dir)
        const page = entries.pages.find((p) => p.slug === slug)
        if (!page) return fail(`“${slug}” does not exist in ${version.label}.`)

        const raw = readAndSend(`${page.slug}.md`, page.path, false) as string
        const { data, content } = matter(raw)
        const title = data.title ?? slug

        let theme = ''
        const themeAsset = entries.assets.find((a) => a.slug === THEME_SLUG)
        if (themeAsset) theme = readAndSend(THEME_SLUG, themeAsset.path, false) as string

        // Render the markdown, discovering which assets it references.
        const { html, referenced } = renderDoc(version, slug, content, entries)

        // Read each referenced asset (times the row, the browser fetches the
        // bytes itself via /assets, also from this same cache).
        for (const aslug of referenced) {
          const asset = entries.assets.find((a) => a.slug === aslug)
          if (asset) readAndSend(aslug, asset.path, true)
        }

        // 4. Hand over the rendered page, then the totals.
        send({
          type: 'content',
          title,
          html,
          theme,
          nav: getNav(entries, version),
          activeSlug: slug,
          referenced: referenced.map((s) => ({ slug: s, href: `/assets/${version.key}/${s}` })),
          allFiles: entries.assets.filter((a) => a.slug !== THEME_SLUG).map((a) => ({ slug: a.slug, ext: a.ext, href: `/assets/${version.key}/${a.slug}` })),
        })
        send({ type: 'done', totals: ops.totals() })
        controller.close()
      } catch (err) {
        fail((err as Error).message)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
