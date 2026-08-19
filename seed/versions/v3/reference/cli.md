---
title: CLI reference
section: Reference
---

# CLI reference

```text
nimbus init                    scaffold a nimbus.toml
nimbus run [--watch] [--poll]  sync, optionally continuously
nimbus deploy --remote <r>     deploy to every region of a remote
nimbus config show --resolved  print the fully resolved config
nimbus keys create|rotate      manage API keys
```

## Common flags

| Flag        | Description                                  |
| ----------- | -------------------------------------------- |
| `--watch`   | re-sync on every source change               |
| `--poll`    | use polling instead of file-system events    |
| `--follow`  | stream a deploy's per-region progress        |
| `-v`        | print the HTTP requests being made           |
