---
title: Installing Nimbus
section: Getting started
---

# Installing Nimbus

![The Nimbus 2.0 platform](./images/logo.jpg)

Nimbus 2.0 runs your sync, your deploys, and now your **edge functions** from one
CLI. Install it however you like:

```bash
brew install nimbus                      # macOS / Linux
npm install -g @nimbus/cli               # Node 18+
docker pull ghcr.io/nimbus/cli:2         # container
winget install Nimbus.CLI                # Windows
```

SDKs track the CLI version:

```bash
npm install @nimbus/sdk        # TypeScript
pip install nimbus-sdk         # Python
go get go.nimbus.dev/sdk       # Go
```

Verify:

```bash
nimbus --version
# nimbus 2.0.0
```

<div class="callout callout-note"><div class="callout-title">Upgrading from 1.x?</div>2.0 changes a few config keys and the token model. Follow the <a href="../../guides/troubleshooting/">migration notes</a> before you deploy.</div>
