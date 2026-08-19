---
title: Quickstart
section: Getting started
---

# Quickstart

Nimbus 0.1 syncs a local folder to a destination directory. That is the whole
program for now.

Initialise a project:

```bash
nimbus init
```

This writes a `.nimbus` marker in the current directory. Then run a one-shot
sync:

```bash
nimbus sync ./data ./out
```

Everything under `./data` is copied to `./out`. Files that already match are
skipped. There is no daemon and no watching yet. You run `nimbus sync` whenever
you want to sync.
