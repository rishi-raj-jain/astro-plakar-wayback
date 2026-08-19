---
title: CLI reference
section: Reference
---

# CLI reference

```text
nimbus init                       scaffold a nimbus.toml
nimbus run [--watch]              sync (and functions) continuously
nimbus deploy --remote <r>        deploy a release (drain by default)
nimbus rollback --remote <r> <id> serve a previous release
nimbus releases list              show immutable release history
nimbus functions check|run        build and test edge functions
nimbus team invite                add a member with a role
nimbus token mint                 create a short-lived, scoped token
nimbus migrate config <file>      upgrade a 1.x config to 2.0
```

## Deploy flags

| Flag              | Default | Description                        |
| ----------------- | ------- | ---------------------------------- |
| `--strategy`      | `drain` | `drain` or `replace`               |
| `--regions`       | all     | limit the release to some regions  |
| `--follow`        | `false` | stream per-region progress         |
| `--dry-run`       | `false` | show the plan without deploying    |
