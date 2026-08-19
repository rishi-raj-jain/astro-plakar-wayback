---
title: Configuration
section: Guides
---

# Configuration

![Nimbus configuration flows into every node](./images/architecture.jpg)

Nimbus 0.5 reads `nimbus.toml` from the project root. A fuller example:

```toml
[project]
name = "docs"
concurrency = 4

[[source]]
type = "local"
path = "./data"
exclude = ["*.tmp", ".DS_Store"]

[destination]
type = "remote"
name = "edge-1"

[remote.edge-1]
url = "https://edge-1.nimbus.dev"
```

Any value can be overridden with an environment variable using the `NIMBUS_`
prefix and double underscores for nesting:

```bash
NIMBUS_PROJECT__CONCURRENCY=8 nimbus sync
```

Environment variables win over the file, and command-line flags win over both.
