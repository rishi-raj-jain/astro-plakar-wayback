---
title: Installing Nimbus
section: Getting started
---

# Installing Nimbus

![The global Nimbus network](./images/logo.jpg)

Nimbus 1.0 is generally available. Install the CLI, or add the SDK to a project.

**CLI**

```bash
brew install nimbus            # macOS / Linux
npm install -g @nimbus/cli     # any platform with Node 18+
```

**SDK**

```bash
npm install @nimbus/sdk
```

Verify:

```bash
nimbus --version
# nimbus 1.0.0
```

1.0 is a stable release: the `nimbus.toml` schema and the CLI surface are now
covered by semantic versioning.
