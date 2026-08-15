<script lang="ts">
  import { describeOp, fmtBytes, type Op } from '@/lib/ops'

  let {
    ops,
    heading = 'Backend operations',
    note = '',
    connecting = false,
    error = '',
    footer = true,
  }: {
    ops: Op[]
    heading?: string
    note?: string
    connecting?: boolean
    error?: string
    footer?: boolean
  } = $props()

  const totals = $derived({
    count: ops.length,
    ms: ops.reduce((n, o) => n + o.ms, 0),
    bytes: ops.reduce((n, o) => n + o.bytes, 0),
  })
</script>

<aside class="opspanel">
  <div class="ops-head">
    <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
    <span class="ops-title">{heading}</span>
  </div>
  <ol class="ops-list">
    {#if connecting}<li class="ops-waiting">Connecting to the backup…</li>{/if}
    {#each ops as op}
      <li class="ops-row">
        <details class="ops-acc">
          <summary class="ops-summary">
            <span class="chev" aria-hidden="true">▸</span>
            <span class="ops-label">{describeOp(op)}</span>
            <span class="spacer"></span>
            {#if op.bytes}<span class="bytes">{fmtBytes(op.bytes)}</span>{/if}
            <span class="ms">{op.ms} ms</span>
          </summary>
          <div class="ops-body">
            <div class="ops-cmd"><span class="prompt">$</span> {op.command}</div>
            <div class="ops-result"><span class="ok">✓ {op.detail}</span></div>
          </div>
        </details>
      </li>
    {/each}
    {#if error}<li class="ops-error">✗ {error}</li>{/if}
    {#if footer}
      <li class="ops-done">
        <span class="muted">{totals.count} operations · {fmtBytes(totals.bytes) || '0 B'} · {totals.ms} ms</span>
      </li>
    {/if}
  </ol>
  {#if note}<p class="ops-note">{note}</p>{/if}
</aside>
