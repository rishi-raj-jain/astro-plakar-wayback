---
title: Deployment
section: Guides
---

# Deployment

Deploy to every region of a remote with one command:

```bash
nimbus deploy --remote edge
```

Or trigger a deploy over the new REST API — handy from a webhook:

```bash
curl -X POST https://edge.nimbus.dev/run \
  -H "Authorization: Bearer $NIMBUS_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "docs", "regions": ["iad", "fra"]}'
```

Deploys are atomic per region: a region either serves the new manifest fully or
keeps the old one. Watch a rollout live:

```bash
nimbus deploy --remote edge --follow
```
