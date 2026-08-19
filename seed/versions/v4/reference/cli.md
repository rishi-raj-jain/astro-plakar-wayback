---
title: CLI reference
section: Reference
---

# CLI reference

```text
nimbus init                       scaffold a nimbus.toml
nimbus run [--watch]              sync, optionally continuously
nimbus deploy --remote <r>        deploy (drain by default)
nimbus plugin search|add|inspect  manage plugins
nimbus token mint                 create a short-lived deploy token
```

## Deploy flags

| Flag               | Default | Description                          |
| ------------------ | ------- | ------------------------------------ |
| `--strategy`       | `drain` | `drain` or `replace`                 |
| `--drain-timeout`  | `60s`   | force-cycle instances after this     |
| `--follow`         | `false` | stream per-region progress           |
| `--regions`        | all     | limit the deploy to some regions     |
