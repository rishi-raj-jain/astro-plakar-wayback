---
title: Configuration
section: Guides
---

# Configuration

![The Nimbus edge fleet](./images/architecture.jpg)

1.5 introduces **plugins**. Add a plugin block to `nimbus.toml` and Nimbus loads
it during sync:

```toml
[project]
name = "docs"
concurrency = 12

[[plugin]]
name = "image-optimize"
version = "^2.0"

[[plugin]]
name = "html-minify"

[remote.edge]
url = "https://edge.nimbus.dev"
regions = ["iad", "fra", "sin", "gru"]
strategy = "drain"
```

Plugins run in order and can transform files before they are deployed. List what
is available:

```bash
nimbus plugin search
nimbus plugin add image-optimize
```

The full architecture is in the spec sheet on the
[References](../references/) page.
