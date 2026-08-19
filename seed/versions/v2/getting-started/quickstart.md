---
title: Quickstart
section: Getting started
---

# Quickstart

In 0.5 a project is described by a `nimbus.toml` file instead of command-line
arguments. Scaffold one:

```bash
nimbus init
```

That writes:

```toml
# nimbus.toml
[project]
name = "docs"

[[source]]
type = "local"
path = "./data"

[destination]
type = "local"
path = "./out"
```

Then sync using the file, with no paths to remember:

```bash
nimbus sync
```

You can also push to a **remote** destination once you have added an API key
(see [Security](../guides/security/)):

```bash
nimbus deploy --remote edge-1
```
