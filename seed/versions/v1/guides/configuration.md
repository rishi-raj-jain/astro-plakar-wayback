---
title: Configuration
section: Guides
---

# Configuration

![A Nimbus worker node](./images/architecture.jpg)

Nimbus 0.1 has no configuration file. Everything is passed on the command line:

```bash
nimbus sync ./data ./out --exclude "*.tmp" --dry-run
```

The available flags are:

- `--exclude <glob>`: skip files matching a glob (repeatable)
- `--dry-run`: print what would change without writing anything
- `--delete`: remove files in the destination that are gone from the source

A config file is planned so you do not have to repeat these on every run.
