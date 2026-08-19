<script lang="ts">
  // A summary of the encrypted Plakar store, shown on every version page (the
  // live current one and each archived one). The store-wide figures come from
  // `plakar at <store> info`; the "% smaller" headline compares the deduplicated
  // footprint with the sum of every version's content. It only appears when
  // there is a real saving. At tiny scale the store's fixed overhead can exceed
  // the content, in which case the panel shows the plain facts. Archived pages
  // additionally get this version's own captured-vs-added figures (versionStat).
  import { fmtBytes } from '@/lib/ops'
  import type { SnapshotStat, StoreInfo } from '@/lib/plakar'

  let {
    info = null,
    diffHref = null,
    diffLabel = null,
    versionStat = null,
  }: {
    info: StoreInfo | null
    diffHref?: string | null
    diffLabel?: string | null
    // This version's own dedup figures (archived pages only); `baseline` is the
    // first snapshot, which pays for the shared media the later versions reuse.
    versionStat?: (SnapshotStat & { label: string; baseline: boolean }) | null
  } = $props()

  // Honest dedup headline: how much smaller the store is than keeping every
  // version as an independent full copy. `logicalBytes` is the sum of all
  // versions' content; `storageBytes` is the real deduplicated footprint on disk.
  // Shown only when it's actually a saving (at tiny scale, fixed overhead can
  // make the store larger than the content, in which case we show only the facts).
  const saved = $derived(info && info.logicalBytes > info.storageBytes ? Math.round((1 - info.storageBytes / info.logicalBytes) * 100) : null)
</script>

{#if info}
  <section class="storepanel card">
    <div class="ops-head">
      <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
      <span class="ops-title">Encrypted Kloset store</span>
    </div>
    {#if saved !== null}
      <div class="store-saved">
        <span class="store-saved-num">{saved}% smaller</span>
        <span class="store-saved-sub">than keeping {info.snapshots} full copies, because identical media is deduplicated across versions</span>
      </div>
    {/if}
    <dl class="store-stats">
      <div>
        <dt>Versions kept</dt>
        <dd>{info.snapshots}</dd>
      </div>
      <div>
        <dt>Logical captured</dt>
        <dd>{fmtBytes(info.logicalBytes)}</dd>
      </div>
      <div>
        <dt>Stored on disk</dt>
        <dd>{fmtBytes(info.storageBytes)}</dd>
      </div>
      <div>
        <dt>Encryption</dt>
        <dd class="mono">{info.encryption}</dd>
      </div>
      <div>
        <dt>Compression</dt>
        <dd class="mono">{info.compression}</dd>
      </div>
      <div>
        <dt>Chunking</dt>
        <dd class="mono">{info.chunking}</dd>
      </div>
    </dl>
    {#if versionStat}
      <div class="store-version">
        <div class="store-version-head">Keeping {versionStat.label} cost</div>
        <div class="store-version-figs">
          <div><span class="store-version-num">{fmtBytes(versionStat.captured)}</span><span class="store-version-lbl">captured</span></div>
          <span class="store-version-arrow">→</span>
          <div><span class="store-version-num">{fmtBytes(versionStat.added)}</span><span class="store-version-lbl">added to store</span></div>
        </div>
        {#if versionStat.baseline}
          <p class="store-version-note">First version. It stores the shared media the later versions deduplicate against.</p>
        {:else}
          <p class="store-version-note"><strong class="store-version-pct">{versionStat.savedPct}% deduplicated</strong> against earlier versions.</p>
        {/if}
      </div>
    {/if}
    {#if diffHref}
      <a class="store-diff-link" href={diffHref}>See what changed: {diffLabel} →</a>
    {/if}
    <p class="store-note">
      Every version is a fully restorable, encrypted snapshot. Files are content-addressed and chunked, so identical pages and images across versions share the same stored chunks.
    </p>
  </section>
{/if}
