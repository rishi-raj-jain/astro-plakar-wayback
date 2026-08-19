---
title: Installing Nimbus
section: Getting started
---

# Installing Nimbus

![Nimbus syncing across machines](./images/logo.jpg)

Nimbus 0.5 is still a single binary, now published to Homebrew and a versioned
release feed.

```bash
brew install nimbus
# or pin a version
curl -fsSL https://get.nimbus.dev/install.sh | sh -s -- --version 0.5.0
```

Check the install:

```bash
nimbus --version
# nimbus 0.5.0
```

Upgrading from 0.1? The `sync` command still works, but projects now use a
`nimbus.toml` file. See [Configuration](../guides/configuration/).
