---
title: Configuration
section: Guides
---

# Configuration

![Nimbus regions around the world](./images/architecture.jpg)

1.0 adds **regions**: a remote can fan out to several locations. Declare them in
`nimbus.toml`:

```toml
[project]
name = "docs"
concurrency = 8

[[source]]
type = "local"
path = "./data"

[remote.edge]
url = "https://edge.nimbus.dev"
regions = ["iad", "fra", "sin"]
```

Deploys go to every listed region in parallel. Check what a config resolves to
before you ship it:

```bash
nimbus config show --resolved
```

As of 1.0 Nimbus refuses to start if `NIMBUS_KEY` is stored in a world-readable
file. Keep it in a secret manager or the environment.
