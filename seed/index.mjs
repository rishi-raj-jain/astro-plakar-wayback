// Rebuilds the demo's version history from the committed seed/versions/ trees.
//
// seed/versions/v1 … seed/versions/v5 are five states of the SAME documentation
// site (same file paths, different content, images, CSS, and embeds). This script
// wipes the Kloset store, then for v1…v4 copies that version into src/docs and
// takes a Plakar snapshot, so each becomes a browsable past version. v5 is left
// in src/docs as the live "current" version. The result is v1…v5 in the app.
//
// Run with:  npm run seed        (uses PLAKAR_PASSPHRASE, default "wayback-demo")
//
// Snapshots are taken ~1.3s apart so their second-resolution timestamps stay
// distinct and ordered (the app numbers versions by snapshot date).

import { execFileSync, execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

const ROOT = process.cwd()
const STORE = process.env.PLAKAR_STORE ?? join(ROOT, '.plakar', 'store')
const DOCS = join(ROOT, 'src', 'docs')
const SEED = join(ROOT, 'seed', 'versions')
const PASSPHRASE = process.env.PLAKAR_PASSPHRASE ?? 'wayback-demo'
const env = { ...process.env, PLAKAR_PASSPHRASE: PASSPHRASE }

const VERSIONS = ['v1', 'v2', 'v3', 'v4', 'v5']
const LIVE = VERSIONS[VERSIONS.length - 1] // v5 stays in src/docs as "current"

function plakar(args) {
  return execFileSync('plakar', ['at', STORE, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] }).toString()
}

function replaceDocs(version) {
  rmSync(DOCS, { recursive: true, force: true })
  mkdirSync(DOCS, { recursive: true })
  cpSync(join(SEED, version), DOCS, { recursive: true })
}

function sleep(ms) {
  execSync(`sleep ${ms / 1000}`)
}

// 1. Fresh, encrypted store.
console.log(`▸ recreating store at ${STORE}`)
rmSync(STORE, { recursive: true, force: true })
mkdirSync(STORE, { recursive: true })
execFileSync('plakar', ['at', STORE, 'create'], { env, stdio: 'inherit' })

// 2. Snapshot v1…v(n-1) as past versions.
for (const version of VERSIONS.slice(0, -1)) {
  replaceDocs(version)
  const out = plakar(['backup', DOCS])
  const id = (out.match(/\b([0-9a-f]{8})\b/) ?? [])[1] ?? '????????'
  console.log(`▸ ${version} → snapshot ${id}`)
  sleep(1300)
}

// 3. Leave the newest version live in src/docs.
replaceDocs(LIVE)
console.log(`▸ ${LIVE} → src/docs (live current version)`)

// 4. Drop Plakar's shared caches so the app reflects the rebuilt store exactly.
rmSync(join(homedir(), '.cache', 'plakar'), { recursive: true, force: true })
rmSync(join(tmpdir(), 'plakar-restore'), { recursive: true, force: true })

// 5. Show the result.
console.log('\n▸ snapshots now in the store:')
process.stdout.write(plakar(['ls']))
console.log(`\n✓ history rebuilt: v1…v${VERSIONS.length} (v${VERSIONS.length} is the live current version)`)

if (!existsSync(join(DOCS, 'theme.css'))) {
  console.error('⚠ src/docs/theme.css missing — check the seed trees')
  process.exit(1)
}
