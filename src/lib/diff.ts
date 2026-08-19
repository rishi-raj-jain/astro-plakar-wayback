// Compares two Plakar snapshots and turns `plakar diff -recursive` into a
// structured change set the UI can render: which files were added, removed, or
// changed, plus the unified hunk for each changed text file.
//
// File existence (added / removed) is computed from each snapshot's own file
// list rather than from plakar's "Only in <dir>" lines, because both snapshots
// share the same root path on disk, which makes those lines ambiguous about
// which side a file lives on. The hunks and the "binary files differ" markers
// come straight from plakar's diff output.

import { getEntries, getVersions, type Entries, type Version } from '@/lib/docs'
import type { Ops } from '@/lib/ops'
import { diffRecursive } from '@/lib/plakar'

export type ChangeKind = 'added' | 'removed' | 'text' | 'binary'

export interface FileChange {
  slug: string
  kind: ChangeKind
  /** Unified diff body (only for text changes). */
  hunk?: string
}

export interface DiffResult {
  from: Version
  to: Version
  changes: FileChange[]
  unchanged: number
  error?: string
}

/** Every file in a version, keyed by slug-with-extension (pages get `.md`). */
function fileSet(entries: Entries): Set<string> {
  return new Set([...entries.pages.map((p) => `${p.slug}.md`), ...entries.assets.map((a) => a.slug)])
}

/** Turn an absolute snapshot path into a slug relative to one of the two roots. */
function relSlug(absPath: string, roots: string[]): string {
  for (const root of roots) {
    if (root && absPath.startsWith(root)) return absPath.slice(root.length).replace(/^\//, '')
  }
  return absPath.replace(/^\//, '')
}

const MARKER = (l: string) => l.startsWith('--- ') || l.startsWith('Only in ') || l.startsWith('Common ') || l.startsWith('Binary files ')

/** Parse `plakar diff -recursive` output into per-file text/binary changes. */
function parseDiff(out: string, roots: string[]): Map<string, FileChange> {
  const changed = new Map<string, FileChange>()
  const lines = out.split('\n')
  for (let i = 0; i < lines.length;) {
    const line = lines[i]
    if (line.startsWith('--- ')) {
      // "--- <id>:<absPath>" then "+++ <id>:<absPath>", then the hunk body.
      const absPath = line.slice(4).split(':').slice(1).join(':')
      const slug = relSlug(absPath, roots)
      let j = i + 2 // skip the --- and +++ header lines
      const body: string[] = []
      for (; j < lines.length && !MARKER(lines[j]); j++) body.push(lines[j])
      changed.set(slug, { slug, kind: 'text', hunk: body.join('\n').replace(/\n+$/, '') })
      i = j
    } else if (line.startsWith('Binary files ')) {
      const m = line.match(/^Binary files (.+) and (.+) differ$/)
      if (m) {
        const slug = relSlug(m[1], roots)
        changed.set(slug, { slug, kind: 'binary' })
      }
      i++
    } else {
      i++ // "Common subdirectories" / "Only in", handled via the file sets
    }
  }
  return changed
}

/**
 * Diff two versions by key (both must be snapshots, not the live current).
 * Orders them oldest → newest so the diff reads as "what changed to get here".
 */
export function diffVersions(fromKey: string, toKey: string, ops?: Ops): DiffResult {
  const versions = getVersions(ops)
  const a = versions.find((v) => v.key === fromKey)
  const b = versions.find((v) => v.key === toKey)
  if (!a || !b) return { from: a ?? b!, to: b ?? a!, changes: [], unchanged: 0, error: 'One of those versions is not in the backup.' }
  // Oldest first: added/removed/changed are all expressed as "from → to".
  const [from, to] = a.date <= b.date ? [a, b] : [b, a]
  if (from.live || to.live) {
    return { from, to, changes: [], unchanged: 0, error: 'Only saved versions can be compared. Back up the current version first.' }
  }

  const fromEntries = getEntries(from, ops)
  const toEntries = getEntries(to, ops)
  const fromFiles = fileSet(fromEntries)
  const toFiles = fileSet(toEntries)
  const roots = [fromEntries.root, toEntries.root]

  const changedByPlakar = parseDiff(diffRecursive(from.id!, to.id!, ops), roots)

  const changes: FileChange[] = []
  for (const slug of toFiles) if (!fromFiles.has(slug)) changes.push({ slug, kind: 'added' })
  for (const slug of fromFiles) if (!toFiles.has(slug)) changes.push({ slug, kind: 'removed' })
  // Modifications only count for files present on both sides.
  let modified = 0
  for (const [slug, change] of changedByPlakar) {
    if (fromFiles.has(slug) && toFiles.has(slug)) {
      changes.push(change)
      modified++
    }
  }

  const order: Record<ChangeKind, number> = { text: 0, binary: 1, added: 2, removed: 3 }
  changes.sort((x, y) => order[x.kind] - order[y.kind] || x.slug.localeCompare(y.slug))

  const common = [...toFiles].filter((s) => fromFiles.has(s)).length
  return { from, to, changes, unchanged: common - modified }
}

/**
 * Adjacent version pairs, newest first, for a "browse the timeline" picker.
 * Only saved (snapshot) versions, so every pair is comparable.
 */
export function versionPairs(ops?: Ops): { from: Version; to: Version }[] {
  const snaps = getVersions(ops).filter((v) => !v.live) // newest → oldest
  const pairs: { from: Version; to: Version }[] = []
  for (let i = 0; i < snaps.length - 1; i++) pairs.push({ from: snaps[i + 1], to: snaps[i] })
  return pairs
}
