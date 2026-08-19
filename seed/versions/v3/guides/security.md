---
title: Security
section: Guides
---

# Security

![The Nimbus deploy dashboard](./images/dashboard.jpg)

1.0 keys are scoped and auditable. Create a key limited to one remote and one
capability:

```bash
nimbus keys create --remote edge --scope deploy
```

Every deploy is signed and recorded. List the audit log through the API:

```bash
curl https://edge.nimbus.dev/audit \
  -H "Authorization: Bearer $NIMBUS_KEY"
```

Rotating a key never interrupts serving — the old key stays valid for a grace
window:

```bash
nimbus keys rotate --remote edge --grace 24h
```

For the full history of security-relevant changes, see the
[release changelog (PDF)](../documents/changelog.pdf).
