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
</script>

{#if info}
  <section class="storepanel card">
    <div class="ops-head">
      <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
      <span class="ops-title">Encrypted Kloset store</span>
    </div>
    <dl class="store-stats">
      {#if versionStat && versionStat.label !== 'v1'}
        <div>
          <div>
            <p class="store-version-note"><strong class="store-saved-num">{versionStat.savedPct}% deduplicated</strong> against earlier versions. See what changed</p>
            {#if diffHref}
              <a class="store-diff-link" href={diffHref}>See what changed: {diffLabel}</a>
            {/if}
            <div class="store-version-head">Keeping {versionStat.label} cost</div>
            <div class="store-version-figs">
              <div><span class="store-version-num">{fmtBytes(versionStat.captured)}</span><span class="store-version-lbl">captured</span></div>
              <span class="store-version-arrow">→</span>
              <div><span class="store-version-num">{fmtBytes(versionStat.added)}</span><span class="store-version-lbl">added to store</span></div>
            </div>
          </div>
        </div>{/if}
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
    <p class="store-note">
      Every version is a fully restorable, encrypted snapshot. Files are content-addressed and chunked, so identical pages and images across versions share the same stored chunks.
    </p>
  </section>
{/if}
