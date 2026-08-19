---
title: Security
section: Guides
---

# Security

![The Nimbus deploy log](./images/dashboard.jpg)

Remote destinations need an API key. Create one in the dashboard and export it:

```bash
export NIMBUS_KEY="nk_live_..."
```

Nimbus reads `NIMBUS_KEY` from the environment. **Never** put it in
`nimbus.toml` — that file is meant to be committed.

Keys are scoped to a single remote and can be rotated without downtime:

```bash
nimbus keys rotate --remote edge-1
```

For the full history of security-relevant changes, see the
[release changelog (PDF)](../documents/changelog.pdf).
