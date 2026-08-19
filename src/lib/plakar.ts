// The only module that talks to the Plakar CLI. Every function optionally takes
// an Ops recorder so the page can show which commands ran, how long they took,
// and how many bytes came back.
//
// Commands used, all verified against Plakar v1.1.0:
//   plakar at <store> ls
//   plakar at <store> locate -snapshot <id> <glob...>
//   plakar at <store> cat <id>:<path>

import type { Op, Ops } from '@/lib/ops'
import { PLAKAR_PASSPHRASE, PLAKAR_STORE, PLAKAR_STORE_LABEL } from 'astro:env/server'
import { execFile, execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/** Absolute path to the Kloset store on disk. */
export const STORE = PLAKAR_STORE ?? join(process.cwd(), '.plakar', 'store')
const PASSPHRASE = PLAKAR_PASSPHRASE ?? 'wayback-demo'

/** The store label shown in the operations panel (a name, not a full path). */
export const STORE_LABEL = PLAKAR_STORE_LABEL

const childEnv = { ...process.env, PLAKAR_PASSPHRASE: PASSPHRASE }
const MAX_BUFFER = 128 * 1024 * 1024

function plakarText(args: string[]): string {
  return execFileSync('plakar', ['at', STORE, ...args], { encoding: 'utf8', env: childEnv, maxBuffer: MAX_BUFFER })
}

function plakarBuffer(args: string[]): Buffer {
  return execFileSync('plakar', ['at', STORE, ...args], { env: childEnv, maxBuffer: MAX_BUFFER })
}

/** Run a Plakar command and record it on the ops log. */
export function runPlakar(args: string[], ops: Ops, label: string, summarize?: (out: string) => { detail?: string; bytes?: number }): string {
  return ops.run(label, () => plakarText(args), summarize)
}

export interface Snapshot {
  id: string
  date: Date
  root: string
}

export interface LocateHit {
  snapshotId: string
  path: string
}

// In-process cache for the read-side plumbing (homepage timeline, version
// switchers, the asset route). These callers pass no Ops recorder, so caching
// them changes nothing visible. It just avoids re-spawning `plakar` for data
// that only changes when a backup runs. Snapshot ids are immutable, so a locate
// result is valid until the snapshot set itself changes, and invalidatePlakarCache()
// (called after backup / new-version) clears it. Calls that DO pass an Ops
// recorder (the live retrieve stream) always bypass the cache and run for real.
// The store only changes through the app's backup / new-version buttons, which
// call invalidatePlakarCache(). The TTL is a long safety bound so a store changed
// out-of-band (a manual SSH backup, a store swapped from R2) self-heals rather
// than staying cached forever, effectively "until a backup or a restart".
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

let snapshotCache: Snapshot[] | null = null
let snapshotCachedAt = 0
const locateCache = new Map<string, { hits: LocateHit[]; at: number }>()

let storeInfoCache: StoreInfo | null = null
let storeInfoCachedAt = 0

/** Drop the cached snapshot list and locate results (call after the store changes). */
export function invalidatePlakarCache(): void {
  snapshotCache = null
  snapshotCachedAt = 0
  locateCache.clear()
  storeInfoCache = null
  storeInfoCachedAt = 0
}

function snapshotCacheFresh(): boolean {
  return snapshotCache !== null && Date.now() - snapshotCachedAt < CACHE_TTL_MS
}

function parseSnapshots(out: string): Snapshot[] {
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [timestamp, id, , , ...rest] = l.split(/\s+/)
      return { id, date: new Date(timestamp), root: rest.join(' ') }
    })
    .filter((s) => s.id && !Number.isNaN(s.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

const LS_COMMAND = `plakar at ${STORE_LABEL} ls`

function lsError(err: unknown): Error {
  const e = err as { stderr?: string; message: string }
  return new Error(`Could not read the Plakar store at "${STORE}". Run \`npm run seed\` or set PLAKAR_STORE / PLAKAR_PASSPHRASE.\n\n${e.stderr || e.message}`)
}

function remember(snaps: Snapshot[]): Snapshot[] {
  snapshotCache = snaps
  snapshotCachedAt = Date.now()
  return snaps
}

function cachedList(ops?: Ops): { snapshots: Snapshot[]; op: Op } | null {
  if (!snapshotCacheFresh()) return null
  const op: Op = { command: LS_COMMAND, detail: `${snapshotCache!.length} snapshots (cached)`, ms: 1, bytes: 0 }
  if (ops) ops.entries.push(op)
  return { snapshots: snapshotCache!, op }
}

function lsSummarize(snaps: Snapshot[]) {
  return { detail: `${snaps.length} snapshots` }
}

/** List snapshots, newest first. Served from the cache (with a "(cached)" row
 * when recorded) until a backup invalidates it or the TTL lapses. */
export function listSnapshots(ops?: Ops): Snapshot[] {
  const hit = cachedList(ops)
  if (hit) return hit.snapshots
  const doIt = () => {
    try {
      return parseSnapshots(plakarText(['ls']))
    } catch (err) {
      throw lsError(err)
    }
  }
  const result = ops ? ops.run(LS_COMMAND, doIt, lsSummarize) : doIt()
  return remember(result)
}

/**
 * Async twin of listSnapshots, records the op and returns it too. Shares the
 * module cache: if the snapshot list is already known (e.g. the homepage loaded
 * it), this returns instantly with a "cached" row instead of re-running `ls`.
 */
export async function listSnapshotsAsync(ops: Ops): Promise<{ snapshots: Snapshot[]; op: Op }> {
  const hit = cachedList(ops)
  if (hit) return hit
  const doIt = async () => {
    try {
      const { stdout } = await execFileAsync('plakar', ['at', STORE, 'ls'], { encoding: 'utf8', env: childEnv, maxBuffer: MAX_BUFFER })
      return parseSnapshots(stdout)
    } catch (err) {
      throw lsError(err)
    }
  }
  const { result, op } = await ops.runAsync(LS_COMMAND, doIt, lsSummarize)
  return { snapshots: remember(result), op }
}

/**
 * Find files matching one or more globs inside a single snapshot. Always pins to
 * one snapshot id, since `locate` with no selector searches every snapshot.
 */
function parseLocate(out: string): LocateHit[] {
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf(':')
      return { snapshotId: l.slice(0, idx), path: l.slice(idx + 1) }
    })
}

function locateCommand(snapshotId: string, globs: string[]): string {
  const short = snapshotId.slice(0, 8)
  const shownGlobs =
    globs.length > 3
      ? `${globs
          .slice(0, 3)
          .map((g) => `'${g}'`)
          .join(' ')} …+${globs.length - 3} more`
      : globs.map((g) => `'${g}'`).join(' ')
  return `plakar at ${STORE_LABEL} locate -snapshot ${short} ${shownGlobs}`
}

export function locate(snapshotId: string, globs: string[], ops?: Ops): LocateHit[] {
  const key = `${snapshotId}::${globs.join(',')}`
  const cached = locateCache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    if (ops) ops.entries.push({ command: locateCommand(snapshotId, globs), detail: `${cached.hits.length} files (cached)`, ms: 1, bytes: 0 })
    return cached.hits
  }
  const command = locateCommand(snapshotId, globs)
  const doIt = () => parseLocate(plakarText(['locate', '-snapshot', snapshotId, ...globs]))
  const result = ops ? ops.run(command, doIt, (hits) => ({ detail: `${hits.length} files` })) : doIt()
  locateCache.set(key, { hits: result, at: Date.now() })
  return result
}

/** Read one file out of a snapshot as text. */
export function readFile(snapshotId: string, absPath: string, ops?: Ops): string {
  const short = snapshotId.slice(0, 8)
  const command = `plakar at ${STORE_LABEL} cat ${short}:${absPath}`
  const doIt = () => plakarText(['cat', `${snapshotId}:${absPath}`])
  return ops ? ops.run(command, doIt, (out) => ({ detail: 'text', bytes: Buffer.byteLength(out) })) : doIt()
}

/**
 * Restore a whole snapshot's file tree to destDir, decrypting it once. Files land
 * relative to the snapshot root (destDir/getting-started/installation.md, …), so
 * destDir behaves just like a plain docs directory afterwards.
 */
export async function restoreSnapshotTo(snapshotId: string, destDir: string): Promise<void> {
  await execFileAsync('plakar', ['at', STORE, 'restore', '-to', destDir, snapshotId], { env: childEnv, maxBuffer: MAX_BUFFER })
}

/** Read one file out of a snapshot as raw bytes (verified byte-identical for PNG and PDF). */
export function readFileBuffer(snapshotId: string, absPath: string, ops?: Ops): Buffer {
  const short = snapshotId.slice(0, 8)
  const command = `plakar at ${STORE_LABEL} cat ${short}:${absPath}`
  const doIt = () => plakarBuffer(['cat', `${snapshotId}:${absPath}`])
  return ops ? ops.run(command, doIt, (buf) => ({ detail: 'binary', bytes: buf.length })) : doIt()
}

// ---- store info (encryption, compression, dedup) ---------------------------

export interface StoreInfo {
  snapshots: number
  /** Physical bytes on disk, after dedup + compression (the store's real footprint). */
  storageBytes: number
  /** Sum of the logical content across every snapshot (what N full copies would cost). */
  logicalBytes: number
  encryption: string
  compression: string
  chunking: string
}

/** Pull the parenthetical "(NNN bytes)" from a `plakar info` line, e.g. "16 MiB (16252546 bytes)". */
function bytesOf(out: string, label: string): number {
  const m = out.match(new RegExp(`${label}:.*?\\((\\d+) bytes\\)`))
  return m ? Number(m[1]) : 0
}

function fieldOf(out: string, label: string): string {
  const m = out.match(new RegExp(`${label}:\\s*(.+)`))
  return m ? m[1].trim() : ''
}

/** The `- Algorithm:` line inside a named block (Chunking, Compression, …). */
function blockAlgo(out: string, block: string): string {
  const m = out.match(new RegExp(`${block}:\\s*\\n\\s*- Algorithm:\\s*(.+)`))
  return m ? m[1].trim() : ''
}

const INFO_COMMAND = `plakar at ${STORE_LABEL} info`

/**
 * Read repository-wide stats straight from `plakar at <store> info`. Cached like
 * the snapshot list (the `info` command runs the Argon2id KDF, ~2s), and
 * invalidated by invalidatePlakarCache() when a backup changes the store.
 */
export function storeInfo(ops?: Ops): StoreInfo {
  const parse = (out: string): StoreInfo => ({
    snapshots: Number(fieldOf(out, 'Snapshots') || 0),
    storageBytes: bytesOf(out, 'Storage size'),
    logicalBytes: bytesOf(out, 'Logical size'),
    encryption: fieldOf(out, 'DataAlgorithm') || 'AES256-GCM-SIV',
    compression: blockAlgo(out, 'Compression') || 'LZ4',
    chunking: blockAlgo(out, 'Chunking') || 'fastcdc',
  })
  if (storeInfoCache && Date.now() - storeInfoCachedAt < CACHE_TTL_MS) {
    if (ops) ops.entries.push({ command: INFO_COMMAND, detail: `${storeInfoCache.snapshots} snapshots (cached)`, ms: 1, bytes: 0 })
    return storeInfoCache
  }
  const doIt = () => parse(plakarText(['info']))
  const result = ops ? ops.run(INFO_COMMAND, doIt, (i) => ({ detail: `${i.snapshots} snapshots` })) : doIt()
  storeInfoCache = result
  storeInfoCachedAt = Date.now()
  return result
}

// ---- diff ------------------------------------------------------------------

// A diff between two snapshots is a pure function of their (content-addressed,
// immutable) ids, so once computed it's valid for this machine's lifetime — no
// TTL, no invalidation. Keyed by `fromId:toId`.
const diffCache = new Map<string, string>()

/** Raw `plakar diff -recursive A B` output (short ids are fine with -recursive). */
export function diffRecursive(fromId: string, toId: string, ops?: Ops): string {
  const command = `plakar at ${STORE_LABEL} diff -recursive ${fromId.slice(0, 8)} ${toId.slice(0, 8)}`
  const key = `${fromId}:${toId}`
  const cached = diffCache.get(key)
  if (cached !== undefined) {
    if (ops) ops.entries.push({ command, detail: 'compared trees (cached)', ms: 1, bytes: Buffer.byteLength(cached) })
    return cached
  }
  const doIt = () => plakarText(['diff', '-recursive', fromId, toId])
  const out = ops ? ops.run(command, doIt, (o) => ({ detail: 'compared trees', bytes: Buffer.byteLength(o) })) : doIt()
  diffCache.set(key, out)
  return out
}

// ---- per-snapshot dedup stats ----------------------------------------------

export interface SnapshotStat {
  /** Logical size of the version's captured files, in bytes. */
  captured: number
  /** How much the store grew when this version was added, in bytes. */
  added: number
  /** Percent deduplicated away = 1 − added/captured (may be negative for the first). */
  savedPct: number
}

let snapshotStatsCache: Record<string, SnapshotStat> | null = null

/**
 * Per-snapshot capture/added figures written by `npm run seed` (the live store
 * can't reconstruct marginal deltas). Keyed by short snapshot id; empty when the
 * file is absent (e.g. versions created from the UI). Read from a JSON sidecar
 * next to the store so it travels with it onto the volume.
 */
export function snapshotStats(): Record<string, SnapshotStat> {
  if (snapshotStatsCache) return snapshotStatsCache
  try {
    snapshotStatsCache = JSON.parse(readFileSync(join(dirname(STORE), 'snapshot-stats.json'), 'utf8'))
  } catch {
    snapshotStatsCache = {}
  }
  return snapshotStatsCache!
}
