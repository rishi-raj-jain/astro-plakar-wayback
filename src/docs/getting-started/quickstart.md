---
title: Quickstart
section: Getting started
---
# Quickstart

Create a project, add a source, and run your first sync:

```bash
nimbus init
nimbus source add local ./data
nimbus run --watch
```

Version 5 adds `--watch`, which re-runs the sync whenever the source changes.
