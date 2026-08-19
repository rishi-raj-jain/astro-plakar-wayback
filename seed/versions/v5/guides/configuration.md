---
title: Configuration
section: Guides
---

# Configuration

![The Nimbus 2.0 edge fleet](./images/architecture.jpg)

`nimbus.toml` in 2.0 adds a `[functions]` block and per-team defaults:

```toml
[project]
name = "docs"
team = "platform"
concurrency = 16

[[source]]
type = "local"
path = "./data"

[functions]
dir = "./functions"
runtime = "edge-js@2"

[[plugin]]
name = "image-optimize"
version = "^2.0"

[remote.edge]
url = "https://edge.nimbus.dev"
regions = ["iad", "fra", "sin", "gru", "syd"]
strategy = "drain"
```

## Resolution order

Values are merged from several places. Later sources win:

| Source                        | Example                              |
| ----------------------------- | ------------------------------------ |
| `nimbus.toml`                 | `concurrency = 16`                   |
| team defaults                 | set in the dashboard                 |
| environment variables         | `NIMBUS_PROJECT__CONCURRENCY=32`     |
| command-line flags            | `--concurrency 32`                   |

Print the fully resolved config before shipping:

```bash
nimbus config show --resolved --format json
```
