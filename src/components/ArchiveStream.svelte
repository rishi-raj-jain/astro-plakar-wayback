<script>
  // The whole archived-page UI, driven by the /api/retrieve NDJSON stream. The
  // shell renders instantly (loading placeholders). On hydration it reads the
  // stream and fills reactive state, so the terminal rows, sidebar, switcher,
  // banner, article, its stylesheet and the file lists all appear as each server
  // command finishes.
  import OpsPanel from '@/components/OpsPanel.svelte'
  import Sidebar from '@/components/Sidebar.svelte'
  import StorePanel from '@/components/StorePanel.svelte'
  import VersionSwitcher from '@/components/VersionSwitcher.svelte'
  import { onMount } from 'svelte'

  let { endpoint, slug, shortId } = $props()

  let ops = $state([])
  let done = $state(false)
  let errorMsg = $state('')
  let connecting = $state(true)
  let heading = $state(`Retrieving snapshot ${shortId}…`)
  let bannerHtml = $state(`Retrieving snapshot <code>${shortId}</code> from the backup…`)
  let versions = $state([])
  let store = $state(null)
  let storeDiffHref = $state(null)
  let storeDiffLabel = $state(null)
  let versionStat = $state(null)
  let nav = $state([])
  let activeSlug = $state('')
  let articleHtml = $state('')
  let theme = $state('')
  let referenced = $state([])
  let allFiles = $state([])
  let pageTitle = $state(`Retrieving ${slug} from backup`)

  // Inject the version's decrypted stylesheet (scoped to .doc) into <head>.
  $effect(() => {
    if (!theme) return
    let s = document.getElementById('archive-theme')
    if (!s) {
      s = document.createElement('style')
      s.id = 'archive-theme'
      document.head.appendChild(s)
    }
    s.textContent = theme
  })

  function handle(e) {
    if (e.type === 'op') {
      connecting = false
      ops = [...ops, e.op]
    } else if (e.type === 'meta') {
      heading = `Retrieving ${e.label} from backup`
      bannerHtml = `Viewing <strong>${e.label}</strong> as it existed on ${e.stamp} UTC. 🔒 Decrypted from the encrypted Plakar snapshot <code>${e.id}</code>, synced to Cloudflare R2, and restored live. The page, its images, PDFs, and stylesheet all come from the backup.`
      versions = e.versions
    } else if (e.type === 'store') {
      store = e.info
      storeDiffHref = e.diffHref
      storeDiffLabel = e.diffLabel
      versionStat = e.versionStat
    } else if (e.type === 'content') {
      articleHtml = e.html
      theme = e.theme
      nav = e.nav
      activeSlug = e.activeSlug
      referenced = e.referenced
      allFiles = e.allFiles
      pageTitle = `${e.title} · retrieved from backup`
    } else if (e.type === 'done') {
      done = true
    } else if (e.type === 'error') {
      connecting = false
      errorMsg = e.message
    }
  }

  onMount(async () => {
    try {
      const res = await fetch(endpoint)
      if (!res.body) throw new Error('Streaming is not supported here.')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      for (;;) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break
        buf += dec.decode(value, { stream: true })
        let nl
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim()
          buf = buf.slice(nl + 1)
          if (line) handle(JSON.parse(line))
        }
      }
    } catch (err) {
      connecting = false
      errorMsg = err.message
    }
  })
</script>

<svelte:head><title>{pageTitle}</title></svelte:head>

<div class="docs-layout">
  <Sidebar {nav} {activeSlug} empty="Loading pages…" />

  <main class="doc-main">
    <VersionSwitcher {versions} />

    <p class="banner">{@html bannerHtml}</p>

    <article class="card doc">
      {#if errorMsg}
        <p class="doc-loading">{errorMsg}</p>
      {:else if articleHtml}
        {@html articleHtml}
      {:else}
        <p class="doc-loading">Retrieving this page from the backup, one command at a time. Watch the terminal on the right.</p>
      {/if}
    </article>

    {#if referenced.length}
      <div class="card files">
        <h3>Retrieved for this page</h3>
        <ul>
          {#each referenced as f}
            <li><a href={f.href}>{f.slug}</a></li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if allFiles.length}
      <div class="card files">
        <h3>All files captured in this version</h3>
        <ul>
          {#each allFiles as f}
            <li><a href={f.href}>{f.slug}</a><span class="badge">{f.ext}</span></li>
          {/each}
        </ul>
      </div>
    {/if}
  </main>

  <aside class="doc-aside">
    <OpsPanel
      {ops}
      {heading}
      {connecting}
      error={errorMsg}
      footer={done}
      note="Plakar decrypts the whole snapshot once, then serves each file from the machine's local cache. Revisits are instant."
    />
    <StorePanel info={store} diffHref={storeDiffHref} diffLabel={storeDiffLabel} {versionStat} />
  </aside>
</div>
