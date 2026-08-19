---
title: Security
section: Guides
---

# Security

![The Nimbus security dashboard](./images/dashboard.jpg)

1.5 adds short-lived deploy tokens on top of long-lived keys. Mint a token that
expires in an hour for CI:

```bash
nimbus token mint --remote edge --scope deploy --ttl 1h
```

Plugins are sandboxed and pinned by content hash. Review what a plugin can touch
before adding it:

```bash
nimbus plugin inspect image-optimize
# capabilities: read-files, write-files
# network:      none
```

<div class="callout callout-warn"><div class="callout-title">Heads up</div>Only add plugins whose <code>network</code> capability is <code>none</code> unless you have reviewed the source. A plugin with network access can exfiltrate the files it processes.</div>

For the full history of security-relevant changes, see the
[release changelog (PDF)](../documents/changelog.pdf).
