---
title: Troubleshooting
section: Guides
---

# Troubleshooting

![Tracing a sync through the pipeline](./images/flow.jpg)

**A region is stuck on the old manifest.** Deploys are atomic, so a region that
failed simply kept serving the previous version. Re-run with `--follow` to see
which region errored:

```bash
nimbus deploy --remote edge --follow
```

**`--watch` isn't picking up changes.** On some network file systems inotify
events are missed. Fall back to polling:

```bash
nimbus run --watch --poll 2s
```

**Debugging the API.** Add `-v` to any command to print the HTTP requests it
makes:

```bash
nimbus deploy --remote edge -v
```
