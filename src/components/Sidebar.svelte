<script lang="ts">
  type NavGroup = { section: string; items: { slug: string; title: string; href: string }[] }

  let { nav, activeSlug = '', empty = '' }: { nav: NavGroup[]; activeSlug?: string; empty?: string } = $props()
</script>

<nav class="sidebar" aria-label="Documentation">
  {#if nav.length}
    {#each nav as group}
      <div class="nav-group">
        <p class="nav-section">{group.section}</p>
        <ul>
          {#each group.items as item}
            <li>
              <a href={item.href} class="nav-link" class:active={item.slug === activeSlug} aria-current={item.slug === activeSlug ? 'page' : undefined}>
                {item.title}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  {:else if empty}
    <p class="sidebar-note">{empty}</p>
  {/if}
</nav>
