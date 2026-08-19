---
title: Installing Nimbus
section: Getting started
---

# Installing Nimbus

![Nimbus edge infrastructure](./images/logo.jpg)

Nimbus 1.5 adds official packages for every major platform and a container
image.

```bash
brew install nimbus                      # macOS / Linux
npm install -g @nimbus/cli               # Node 18+
docker pull ghcr.io/nimbus/cli:1.5       # container
```

Language SDKs are published for TypeScript, Python, and Go:

```bash
npm install @nimbus/sdk
pip install nimbus-sdk
go get go.nimbus.dev/sdk
```

Verify:

```bash
nimbus --version
# nimbus 1.5.0
```
