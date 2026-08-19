---
title: Troubleshooting
section: Guides
---

# Troubleshooting

![A sync in progress](./images/flow.jpg)

**Nothing happened.** Make sure you ran `nimbus init` in the project first. The
sync refuses to run without a `.nimbus` marker.

**Some files were skipped.** Nimbus compares size and modification time. Touch a
file or pass `--force` to copy it anyway:

```bash
nimbus sync ./data ./out --force
```

If a sync looks wrong, re-run it with `--dry-run` to see the plan before any
files are written.
