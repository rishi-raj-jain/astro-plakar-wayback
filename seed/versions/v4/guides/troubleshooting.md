---
title: Troubleshooting
section: Guides
---

# Troubleshooting

![Tracing a deploy across regions](./images/flow.jpg)

**A plugin failed the sync.** Run it in isolation with verbose logging:

```bash
nimbus plugin run image-optimize ./data -v
```

**Drain never finishes.** An instance is stuck on a long-lived connection. Cap
the drain window so it force-cycles:

```bash
nimbus deploy --remote edge --strategy drain --drain-timeout 30s
```

**Traces aren't showing up.** Confirm the collector endpoint resolves from inside
the node and that `metrics = true` is set under `[telemetry]`.

<div class="callout callout-tip"><div class="callout-title">Tip</div>Add <code>-v</code> to any command to see the exact HTTP calls and plugin steps Nimbus runs.</div>
