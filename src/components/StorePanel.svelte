<script lang="ts">
  // A factual summary of the encrypted Plakar store, shown on every version page
  // (the live current one and each archived one). Every number comes from
  // `plakar at <store> info` — real, store-wide facts about the encrypted store
  // that holds all versions. Deliberately no "% saved" headline: at this demo's
  // scale the store's fixed packfile/index overhead exceeds the content, so any
  // dedup-savings percentage would be misleading.
  import { fmtBytes } from '@/lib/ops'
  import type { StoreInfo } from '@/lib/plakar'

  let {
    info = null,
    diffHref = null,
    diffLabel = null,
  }: {
    info: StoreInfo | null
    diffHref?: string | null
    diffLabel?: string | null
  } = $props()
</script>

{#if info}
  <section class="storepanel card">
    <div class="ops-head">
      <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
      <span class="ops-title">Encrypted Kloset store</span>
    </div>
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
    {#if diffHref}
      <a class="store-diff-link" href={diffHref}>See what changed: {diffLabel} →</a>
    {/if}
    <p class="store-note">
      Every version is a fully restorable, encrypted snapshot. Files are content-addressed and chunked, so identical pages and images across versions share the same stored chunks.
    </p>
  </section>
{/if}
