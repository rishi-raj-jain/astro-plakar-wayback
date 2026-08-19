---
title: CLI reference
section: Reference
---

# CLI reference

The complete 0.1 command set:

```text
nimbus init                 mark the current directory as a project
nimbus sync <src> <dst>     copy <src> to <dst>
nimbus --version            print the version
nimbus --help               show help
```

## Flags for `sync`

| Flag             | Description                                   |
| ---------------- | --------------------------------------------- |
| `--exclude`      | skip files matching a glob (repeatable)       |
| `--dry-run`      | show the plan without writing                 |
| `--delete`       | delete extra files in the destination         |
| `--force`        | copy even when size and mtime match           |
