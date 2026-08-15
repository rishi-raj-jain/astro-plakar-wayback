---
title: Configuration
section: Guides
---
# Configuration

![Architecture](./images/architecture.png)

Set `NIMBUS_KEY` from a secret manager. As of version 3 Nimbus refuses to start
if the key is present in a world-readable file. Configuration is read from
`nimbus.toml`, and environment variables override file values.
