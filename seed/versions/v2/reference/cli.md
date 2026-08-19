---
title: CLI reference
section: Reference
---

# CLI reference

```text
nimbus init                 scaffold a nimbus.toml
nimbus sync                 sync using nimbus.toml
nimbus deploy --remote <r>  push output to a remote
nimbus keys rotate          rotate a remote's API key
nimbus --version            print the version
```

## Global flags

| Flag           | Description                              |
| -------------- | ---------------------------------------- |
| `--config`     | path to a `nimbus.toml` (default: `./`)  |
| `--remote`     | target remote for `deploy`               |
| `--dry-run`    | show the plan without writing            |
| `--concurrency`| number of parallel workers               |
