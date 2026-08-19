---
title: Troubleshooting
section: Guides
---

# Troubleshooting

![Tracing a 2.0 release across regions](./images/flow.jpg)

## Migrating from 1.x

Two config keys changed in 2.0:

```diff
 [project]
 name = "docs"
-worker_count = 12
+concurrency = 16

-[remote.edge]
-single_token = "nk_live_..."
+[remote.edge]
+# tokens are now minted per role (see Security)
```

Run the migration helper to rewrite an old file in place:

```bash
nimbus migrate config ./nimbus.toml
```

## Common issues

**A function won't build.** Check the runtime matches your code:

```bash
nimbus functions check --runtime edge-js@2
```

**A region is behind.** Releases are atomic, so a lagging region kept an older
release. Inspect and, if needed, redeploy just that region:

```bash
nimbus releases list --remote edge
nimbus deploy --remote edge --regions fra
```

<div class="callout callout-note"><div class="callout-title">Still stuck?</div>Add <code>-v</code> for HTTP-level logs, or open the release in the dashboard to see per-region traces.</div>
