// Decrypt each snapshot exactly once per machine lifetime, then serve its files
// from local disk. `plakar restore` opens/decrypts the encrypted store one time
// and writes the plaintext tree to a cache dir under the OS temp dir. After that
// every page, image, and stylesheet is a plain fs read, no per-file `plakar`
// process, no repeated store-open. On machine respawn the temp dir is gone, so
// the CLI decrypts again. The encrypted store (on the volume and in R2) is the
// durable artifact. This is just a hot, plaintext read-through cache.
//
// A per-snapshot in-flight lock keeps two simultaneous first-hits from both
// restoring (a cache stampede): the first caller runs the restore, the rest await
// the same promise. Restores go to a `.partial` dir and are atomically renamed
// into place, so a reader never sees a half-written cache dir.

import { buildEntries, walkFiles, type Entries } from '@/lib/docs'
import { restoreSnapshotTo } from '@/lib/plakar'
import { existsSync, statSync } from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const RESTORE_ROOT = join(tmpdir(), 'plakar-restore')
const inFlight = new Map<string, Promise<string>>()
const entriesCache = new Map<string, Entries>()

export interface RestoreResult {
  dir: string
  cached: boolean
  ms: number
  files: number
  bytes: number
}

function dirStats(dir: string): { files: number; bytes: number } {
  let files = 0
  let bytes = 0
  for (const p of walkFiles(dir)) {
    files++
    bytes += statSync(p).size
  }
  return { files, bytes }
}

async function doRestore(snapshotId: string, finalDir: string): Promise<string> {
  const partial = `${finalDir}.partial-${process.pid}-${Date.now()}`
  await mkdir(RESTORE_ROOT, { recursive: true })
  await rm(partial, { recursive: true, force: true })
  await restoreSnapshotTo(snapshotId, partial)
  await rename(partial, finalDir) // atomic: finalDir only exists once fully restored
  return finalDir
}

/**
 * Ensure a snapshot is decrypted to local disk, exactly once. Concurrent first
 * hits for the same snapshot share one restore. Returns where the plaintext is
 * and whether it was already cached (with the wall-clock time spent).
 */
export async function ensureRestored(snapshotId: string): Promise<RestoreResult> {
  const finalDir = join(RESTORE_ROOT, snapshotId)
  // Cached: skip walking the tree. Callers on this path (asset serving, warm
  // page views) don't need the file/byte counts, only the dir.
  if (existsSync(finalDir)) return { dir: finalDir, cached: true, ms: 0, files: 0, bytes: 0 }

  const start = performance.now()
  let promise = inFlight.get(snapshotId)
  if (!promise) {
    promise = doRestore(snapshotId, finalDir)
    inFlight.set(snapshotId, promise)
    void promise.catch(() => {}).finally(() => inFlight.delete(snapshotId))
  }
  await promise
  const ms = Math.max(1, Math.round(performance.now() - start))
  return { dir: finalDir, cached: false, ms, ...dirStats(finalDir) }
}

/** Pages + assets of a restored snapshot dir, built once and cached. */
export function entriesFor(dir: string): Entries {
  let entries = entriesCache.get(dir)
  if (!entries) {
    entries = buildEntries(walkFiles(dir), dir)
    entriesCache.set(dir, entries)
  }
  return entries
}
