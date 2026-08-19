// Write-side operations that the single "Create new version" button triggers:
//   - createNewVersion(): back up the current ./docs as a saved version, then
//     mutate ./docs into the next version (editing existing files, so every
//     version keeps the same file paths).
//   - pushStoreToR2(): upload the store tarball to R2 over the S3 API (aws4fetch)
//
// Each returns an Ops log so the UI can show what ran on the backend.

import { Ops, type Op } from '@/lib/ops'
import { invalidatePlakarCache, listSnapshots, runPlakar, STORE, STORE_LABEL, type Snapshot } from '@/lib/plakar'
import { putObject, r2Configured } from '@/lib/r2'
import { DOCS_DIR as ENV_DOCS_DIR, R2_BUCKET, R2_OBJECT } from 'astro:env/server'
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'

const DOCS = ENV_DOCS_DIR ?? join(process.cwd(), 'src', 'docs')

export interface ActionResult {
  ok: boolean
  ops: Op[]
  snapshotCount?: number
  latest?: Snapshot
  newVersion?: number
}

// A small, deterministic content change so each "new version" visibly differs.
const ACCENTS = ['#e11d48', '#ea580c', '#16a34a', '#0891b2', '#9333ea', '#2563eb']

/**
 * One click = one new saved version. Backs up the current ./docs so it becomes a
 * permanent, browsable snapshot, then edits ./docs in place (a theme recolor and
 * a dated note) so the new live "current" version visibly differs — while keeping
 * the exact same file paths every version has.
 */
export function createNewVersion(): ActionResult {
  const ops = new Ops()
  const before = listSnapshots().length
  const savedNum = before + 1 // the current version we back up now
  const nextNum = before + 2 // the new live current after we mutate

  // 1. Back up the current docs, so this version is saved and retrievable.
  runPlakar(['backup', DOCS], ops, `plakar at ${STORE_LABEL} backup ./docs (save v${savedNum})`, (out) => {
    const m = out.match(/^([0-9a-f]{8})/m)
    return { detail: m ? `snapshot ${m[1]} = v${savedNum}` : `saved v${savedNum}` }
  })
  runPlakar(['check'], ops, `plakar at ${STORE_LABEL} check`, () => ({ detail: 'integrity verified' }))
  invalidatePlakarCache() // the backup added a snapshot

  // 2. Mutate ./docs into v{nextNum} by editing EXISTING files (same paths).
  const accent = ACCENTS[nextNum % ACCENTS.length]
  ops.run(
    `edit docs/theme.css (accent ${accent})`,
    () => {
      const override =
        `\n/* v${nextNum} — recolored by "Create a new version" */\n` +
        `.doc { --accent: ${accent}; }\n` +
        `.doc h1, .doc h2, .doc h3 { color: ${accent}; }\n` +
        `.doc a { color: ${accent}; }\n`
      appendFileSync(join(DOCS, 'theme.css'), override)
      return override
    },
    (css) => ({ detail: 'theme recolored', bytes: Buffer.byteLength(css) }),
  )

  ops.run(
    `edit docs/references.md (v${nextNum} note)`,
    () => {
      const note =
        `\n## Version ${nextNum}\n\n` +
        `Created from the panel at ${new Date().toISOString()}. The accent color changed and ` +
        `this note was added, so comparing v${nextNum - 1} with v${nextNum} shows a real ` +
        `difference restored from the backup.\n`
      appendFileSync(join(DOCS, 'references.md'), note)
      return note
    },
    (b) => ({ detail: 'page updated', bytes: Buffer.byteLength(b) }),
  )

  // v{savedNum} is now a saved snapshot; v{nextNum} is the live current, which
  // the next click will save in turn. So one click adds exactly one saved version
  // and advances the current by one.
  const snaps = listSnapshots(ops)
  return { ok: true, ops: ops.entries, newVersion: nextNum, snapshotCount: snaps.length, latest: snaps[0] }
}

const R2_PUT_LABEL = `PUT s3://${R2_BUCKET}/${R2_OBJECT}`

// Pack from the store's real location (which may be a volume the local
// ./.plakar/store symlinks to), so tar archives its contents, not the symlink.
const STORE_PARENT = dirname(STORE)
const STORE_NAME = basename(STORE)
const TARBALL = join(tmpdir(), 'kloset-store.tar.gz')

/** Pack the store into a tarball and return its bytes, recording the op. */
function packStore(ops: Ops): Buffer {
  return ops.run(
    `tar czf kloset-store.tar.gz ${STORE_NAME}`,
    () => {
      execFileSync('tar', ['-C', STORE_PARENT, '-czf', TARBALL, STORE_NAME])
      return readFileSync(TARBALL)
    },
    (buf) => ({ detail: 'packed', bytes: buf.length }),
  )
}

/** Upload the store tarball to R2 over the S3 API (aws4fetch), and wait for it. */
export async function pushStoreToR2(): Promise<ActionResult> {
  const ops = new Ops()
  const buf = packStore(ops)
  if (!r2Configured()) {
    ops.entries.push({ command: R2_PUT_LABEL, detail: 'skipped (R2 not configured)', ms: 0, bytes: 0 })
    return { ok: true, ops: ops.entries }
  }
  await ops.runAsync(
    R2_PUT_LABEL,
    () => putObject(buf),
    () => ({ detail: 'uploaded to R2', bytes: buf.length }),
  )
  return { ok: true, ops: ops.entries }
}

/** Finish a write action by pushing the store to R2, then return JSON for the UI. */
export async function jsonWithR2(result: ActionResult): Promise<Response> {
  let r2ops: Op[] = []
  try {
    // Await the upload so it finishes before the machine can idle-stop.
    r2ops = (await pushStoreToR2()).ops
  } catch (err) {
    const message = (err as Error).message.split('\n')[0]
    r2ops = [{ command: 'PUT store → R2', detail: `failed (${message})`, ms: 0, bytes: 0 }]
  }
  return Response.json({ ...result, ops: [...result.ops, ...r2ops] })
}
