<script>
  // Controls for the current (live) version. "Back up" snapshots the live docs
  // as-is. "Create new version" preserves the current state then changes the docs
  // so the next version differs. Each posts to its API route, reveals the returned
  // ops one at a time, then reloads to show the result.
  let ops = $state([])
  let title = $state('')
  let open = $state(false)
  let busy = $state(false)

  async function fire(url, label) {
    busy = true
    ops = []
    title = label + '…'
    open = true
    try {
      // Content-Type must be non-form, or Astro's CSRF checkOrigin rejects the POST.
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      for (const o of data.ops ?? []) {
        ops = [...ops, o]
        await new Promise((r) => setTimeout(r, 160 + Math.random() * 140))
      }
      title = data.newVersion ? `created v${data.newVersion}, reloading…` : 'done, reloading…'
      setTimeout(() => location.reload(), 1200)
    } catch (err) {
      title = 'error: ' + err.message
      busy = false
    }
  }
</script>

<section class="vactions card">
  <h3>Current version</h3>
  <p class="muted">Back up the current docs as a saved version and advance to a new one.</p>
  <div class="vactions-btns">
    <button class="btn sm" disabled={busy} onclick={() => fire('/api/version', 'Creating a new version')}>Create new version</button>
  </div>
  {#if open}
    <div class="vresult">
      <div class="vresult-title">{title}</div>
      <ol class="vresult-list">
        {#each ops as o}
          <li>
            <div class="cmd">{o.command}</div>
            <div class="meta">{o.detail ?? ''} {o.ms ? `${o.ms} ms` : ''}</div>
          </li>
        {/each}
      </ol>
    </div>
  {/if}
</section>
