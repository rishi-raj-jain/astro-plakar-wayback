<script lang="ts">
  let { versions }: { versions: { label: string; live: boolean; active: boolean; href: string }[] } = $props()
</script>

<nav class="switcher" aria-label="Document versions">
  <span class="switcher-label">Versions of this page:</span>
  {#each versions as v}
    {#if v.active}
      <span class="chip active">{v.label}{v.live ? ' · current' : ''}</span>
    {:else}
      <a class="chip" href={v.href}>{v.label}{v.live ? ' · current' : ''}</a>
    {/if}
  {/each}
</nav>
