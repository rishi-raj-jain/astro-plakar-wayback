---
title: Deployment
section: Guides
---

# Deployment

## Functions and assets, together

2.0 deploys your static output and your edge functions in one atomic release:

```bash
nimbus deploy --remote edge --follow
```

```text
→ building functions (edge-js@2) … 2 functions, 41ms
→ iad   drain ██████████ served rel_9f2a
→ fra   drain ██████████ served rel_9f2a
→ sin   drain ██████████ served rel_9f2a
✓ release rel_9f2a live in 5 regions (4.1s)
```

## Rollback

Every release is immutable and addressable. Roll back instantly:

```bash
nimbus releases list --remote edge
nimbus rollback --remote edge rel_9e11
```

<div class="callout callout-tip"><div class="callout-title">Tip</div>A rollback is just a deploy of an older release, so it drains the same way, with no downtime and no rebuild.</div>

## Observability

Traces and metrics are on by default in 2.0:

```bash
curl https://edge.nimbus.dev/metrics
# nimbus_function_invocations_total{region="iad",fn="hello"} 1832
# nimbus_deploy_duration_seconds{region="iad"} 4.1
```
