// Version, page, and asset model. Every retrieval optionally records the Plakar
// operation that performed it, so a page can show exactly what the backend did.
//
// Current docs are read live from src/docs on disk (the latest version). Older
// versions are read out of Plakar snapshots pulled from R2.

import type { Ops } from '@/lib/ops'
import { listSnapshots, locate, readFile, readFileBuffer, type Snapshot } from '@/lib/plakar'
import { DOCS_DIR as ENV_DOCS_DIR } from 'astro:env/server'
import matter from 'gray-matter'
import { Marked } from 'marked'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, posix } from 'node:path'

const DOCS_DIR = ENV_DOCS_DIR ?? join(process.cwd(), 'src', 'docs')

const ASSET_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'pdf', 'mp4', 'webm', 'mov', 'csv', 'json', 'zip', 'css'])
export const THEME_SLUG = 'theme.css'
export const PAGE_GLOB = '*.md'
export const ASSET_GLOBS = [...ASSET_EXTS].map((e) => `*.${e}`)

const extOf = (p: string): string => extname(p).slice(1).toLowerCase()
const kindOf = (p: string): 'page' | 'asset' | null => (extOf(p) === 'md' ? 'page' : ASSET_EXTS.has(extOf(p)) ? 'asset' : null)

export interface Version {
  key: string
  num: number
  label: string
  live: boolean
  date: Date
  id?: string
}

export interface Page {
  slug: string
  path: string
}

export interface Asset {
  slug: string
  path: string
  ext: string
}

export interface Entries {
  root: string
  pages: Page[]
  assets: Asset[]
}

// ---- helpers ---------------------------------------------------------------

function commonDir(paths: string[]): string {
  if (paths.length === 0) return ''
  const split = paths.map((p) => p.split('/'))
  const first = split[0]
  let i = 0
  for (; i < first.length; i++) {
    if (!split.every((parts) => parts[i] === first[i])) break
  }
  return first.slice(0, i).join('/')
}

export function walkFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walkFiles(full))
    else out.push(full)
  }
  return out
}

// ---- versions --------------------------------------------------------------

/** Build the version list (current + one per snapshot) from raw snapshots. */
export function buildVersions(snaps: Snapshot[]): Version[] {
  const total = snaps.length + 1
  const current: Version = { key: 'current', num: total, label: `v${total}`, live: true, date: new Date() }
  const history: Version[] = snaps.map((s, i) => ({
    key: `${s.date.toISOString().slice(0, 10)}-${s.id}`,
    num: total - 1 - i,
    label: `v${total - 1 - i}`,
    live: false,
    date: s.date,
    id: s.id,
  }))
  return [current, ...history]
}

/** Every version, newest first: the live current docs, then each snapshot. */
export function getVersions(ops?: Ops): Version[] {
  return buildVersions(listSnapshots(ops))
}

export function getVersion(key: string, ops?: Ops): Version | null {
  return getVersions(ops).find((v) => v.key === key) ?? null
}

export function hrefFor(version: Version, slug: string): string {
  return version.live ? `/docs/${slug}/` : `/archive/${version.key}/${slug}/`
}

// ---- entries (pages + assets) ---------------------------------------------

/** Split a list of file paths into pages and assets, with slugs relative to root. */
export function buildEntries(paths: string[], root: string = commonDir(paths)): Entries {
  const pages: Page[] = []
  const assets: Asset[] = []
  for (const path of paths) {
    const kind = kindOf(path)
    if (!kind) continue
    const rel = path.slice(root.length).replace(/^\//, '')
    if (kind === 'page') pages.push({ slug: rel.replace(/\.md$/, ''), path })
    else assets.push({ slug: rel, path, ext: extOf(path) })
  }
  pages.sort((a, b) => a.slug.localeCompare(b.slug))
  assets.sort((a, b) => a.slug.localeCompare(b.slug))
  return { root, pages, assets }
}

/** Pages and assets in a version, with slugs relative to the docs root. */
export function getEntries(version: Version, ops?: Ops): Entries {
  if (version.live) {
    const doScan = () => walkFiles(DOCS_DIR)
    const paths = ops ? ops.run('read src/docs (local disk)', doScan, (f) => ({ detail: `${f.length} files` })) : doScan()
    return buildEntries(paths, DOCS_DIR)
  }
  const hits = locate(version.id!, [PAGE_GLOB, ...ASSET_GLOBS], ops)
  return buildEntries(hits.map((h) => h.path))
}

export interface RenderedPage {
  title: string
  section: string
  body: string
}

/** Read one page's markdown. Returns null if it does not exist in this version. */
export function getPage(version: Version, slug: string, entries: Entries, ops?: Ops): RenderedPage | null {
  const page = entries.pages.find((p) => p.slug === slug)
  if (!page) return null
  let raw: string
  if (version.live) {
    const doRead = () => readFileSync(page.path, 'utf8')
    raw = ops ? ops.run(`read src/docs/${slug}.md (local disk)`, doRead, (s) => ({ detail: 'text', bytes: Buffer.byteLength(s) })) : doRead()
  } else {
    raw = readFile(version.id!, page.path, ops)
  }
  const { data, content } = matter(raw)
  return { title: data.title ?? slug, section: data.section ?? '', body: content }
}

export interface NavLink {
  slug: string
  title: string
  href: string
}
export interface NavGroup {
  section: string
  items: NavLink[]
}

const SECTION_ORDER = ['Getting started', 'Guides', 'Reference']

/**
 * Build the left-sidebar nav for a version: its pages grouped by their `section`
 * front-matter, in a sensible order. Reads each page's front-matter from disk, so it
 * works for the live docs and for a restored snapshot dir alike, since both hand
 * back real local file paths in `entries`.
 */
export function getNav(entries: Entries, version: Version): NavGroup[] {
  const bySection = new Map<string, NavLink[]>()
  for (const page of entries.pages) {
    let title = page.slug
    let section = 'Docs'
    try {
      const { data } = matter(readFileSync(page.path, 'utf8'))
      title = data.title ?? page.slug
      section = data.section ?? 'Docs'
    } catch {
      /* skip unreadable page */
    }
    if (!bySection.has(section)) bySection.set(section, [])
    bySection.get(section)!.push({ slug: page.slug, title, href: hrefFor(version, page.slug) })
  }
  const rank = (s: string) => (SECTION_ORDER.indexOf(s) === -1 ? 999 : SECTION_ORDER.indexOf(s))
  return [...bySection.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([section, items]) => ({ section, items: items.sort((x, y) => x.title.localeCompare(y.title)) }))
}

/** Read one asset's raw bytes. Returns null if it does not exist in this version. */
export function getAssetBytes(version: Version, assetSlug: string, entries: Entries, ops?: Ops): Buffer | null {
  const asset = entries.assets.find((a) => a.slug === assetSlug)
  if (!asset) return null
  if (version.live) {
    const doRead = () => readFileSync(asset.path)
    return ops ? ops.run(`read src/docs/${assetSlug} (local disk)`, doRead, (b) => ({ detail: asset.ext, bytes: b.length })) : doRead()
  }
  return readFileBuffer(version.id!, asset.path, ops)
}

/** Which versions contain a given page slug (for the version switcher). */
export function versionsWithPage(slug: string): (Version & { has: boolean })[] {
  return getVersions().map((v) => ({ ...v, has: getEntries(v).pages.some((p) => p.slug === slug) }))
}

export interface SwitcherChip {
  label: string
  live: boolean
  active: boolean
  href: string
}

/** Version chips for the switcher (every version, with the active one marked). */
export function switcherChips(versions: Version[], slug: string, activeKey: string): SwitcherChip[] {
  return versions.map((v) => ({ label: v.label, live: v.live, active: v.key === activeKey, href: hrefFor(v, slug) }))
}

/** Version chips limited to versions that actually contain this page. */
export function switcherVersions(slug: string, activeKey: string): SwitcherChip[] {
  return switcherChips(
    versionsWithPage(slug).filter((v) => v.has),
    slug,
    activeKey,
  )
}

/** Retrieve this version's stylesheet (theme.css) so the archived page looks the way it did. */
export function getTheme(version: Version, entries: Entries, ops?: Ops): string {
  const asset = entries.assets.find((a) => a.slug === THEME_SLUG)
  if (!asset) return ''
  if (version.live) {
    const doRead = () => readFileSync(asset.path, 'utf8')
    return ops ? ops.run(`read src/docs/${THEME_SLUG} (local disk)`, doRead, (s) => ({ detail: 'css', bytes: Buffer.byteLength(s) })) : doRead()
  }
  return readFile(version.id!, asset.path, ops)
}

// ---- markdown rendering with per-version asset URLs ------------------------

const isExternal = (href: string): boolean => /^([a-z]+:|\/\/|#|\/)/i.test(href)

function resolveRef(entries: Entries, pageSlug: string, href: string): string | null {
  if (!href || isExternal(href)) return null
  const clean = href.split(/[?#]/)[0]
  const target = posix.normalize(posix.join(posix.dirname(pageSlug), clean)).replace(/^\.\//, '')
  return entries.assets.some((a) => a.slug === target) ? target : null
}

export interface RenderResult {
  html: string
  referenced: string[]
}

/**
 * Render markdown to HTML, rewriting every relative asset reference to this
 * version's copy. Two passes:
 *   1. Markdown image/link tokens (`![](./x.png)`, `[](./x.pdf)`).
 *   2. Raw-HTML embeds in the doc body — `src`/`data`/`poster` on <iframe>,
 *      <embed>, <object>, <video>, <img> — so an embedded PDF or image points at
 *      /assets/<version>/… and archived versions embed their own copy. External
 *      URLs (a YouTube <iframe>, absolute paths) are left untouched.
 */
export function renderDoc(version: Version, pageSlug: string, body: string, entries: Entries): RenderResult {
  const referenced = new Set<string>()
  const rewrite = (ref: string): string | null => {
    const slug = resolveRef(entries, pageSlug, ref)
    if (!slug) return null
    referenced.add(slug)
    return `/assets/${version.key}/${slug}`
  }
  const md = new Marked({
    walkTokens: (token) => {
      if ((token.type === 'image' || token.type === 'link') && token.href) {
        const to = rewrite(token.href)
        if (to) token.href = to
      }
    },
  })
  let html = md.parse(body) as string
  html = html.replace(/\b(src|data|poster|href)=(["'])([^"']+)\2/gi, (whole, attr, quote, ref) => {
    const to = rewrite(ref)
    return to ? `${attr}=${quote}${to}${quote}` : whole
  })
  return { html, referenced: [...referenced] }
}
