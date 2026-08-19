---
title: Security
section: Guides
---

# Security

![The Nimbus 2.0 security dashboard](./images/dashboard.jpg)

2.0 organises access around **teams**. Members get roles. Deploy tokens are
minted per role and expire.

```bash
nimbus team invite alex@acme.dev --role deployer
nimbus token mint --remote edge --scope deploy --ttl 1h
```

| Role       | Can deploy | Can manage keys | Can invite |
| ---------- | :--------: | :-------------: | :--------: |
| `viewer`   |     ✗      |        ✗        |     ✗      |
| `deployer` |     ✓      |        ✗        |     ✗      |
| `admin`    |     ✓      |        ✓        |     ✓      |

Edge functions run in a sandbox with no ambient credentials. Secrets are
injected explicitly:

```bash
nimbus secret set STRIPE_KEY --remote edge
```

<div class="callout callout-warn"><div class="callout-title">Never commit keys</div>Keep <code>NIMBUS_KEY</code> and any function secrets in a secret manager or the environment. <code>nimbus.toml</code> is meant to be committed and must stay free of credentials.</div>

For the full history of security-relevant changes, see the
[release changelog (PDF)](../documents/changelog.pdf).
