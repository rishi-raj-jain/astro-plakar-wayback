---
title: Security
section: Guides
---

# Security

![Reviewing a sync run](./images/dashboard.jpg)

Nimbus 0.1 runs entirely on your machine and talks to no network, so there are
no credentials to manage yet.

The one thing to know: `--delete` removes files from the destination. Always try
it with `--dry-run` first:

```bash
nimbus sync ./data ./out --delete --dry-run
```

Remote sources and API keys arrive in a later release. This page will grow with
them.
