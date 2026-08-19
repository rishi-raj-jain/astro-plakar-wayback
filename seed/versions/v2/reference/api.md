---
title: API reference
section: Reference
---

# API reference

0.5 remotes expose a small management API. Authenticate with your API key as a
bearer token:

```bash
curl https://edge-1.nimbus.dev/status \
  -H "Authorization: Bearer $NIMBUS_KEY"
```

Available endpoints:

- `GET /status`: node health and last deploy time
- `GET /manifest`: the file list currently served by the node

There is no write API yet. Deploys go through the `nimbus` CLI. A full REST API
(including `POST /run`) arrives in 1.0.
