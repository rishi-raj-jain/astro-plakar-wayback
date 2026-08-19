---
title: API reference
section: Reference
---

# API reference

1.5 adds plugin and telemetry endpoints. All require a bearer token or a
short-lived deploy token.

| Method | Path         | Description                     |
| ------ | ------------ | ------------------------------- |
| `GET`  | `/status`    | node health and last deploy     |
| `GET`  | `/manifest`  | files currently served          |
| `GET`  | `/metrics`   | Prometheus metrics              |
| `GET`  | `/audit`     | signed deploy history           |
| `POST` | `/run`       | trigger a deploy                |
| `POST` | `/plugins`   | register a plugin for a project |

## Example: deploy with a strategy

```bash
curl -X POST https://edge.nimbus.dev/run \
  -H "Authorization: Bearer $NIMBUS_TOKEN" \
  -d '{"source": "docs", "strategy": "drain", "regions": ["iad", "fra"]}'
```

```json
{
  "deploy": "dpl_8b21",
  "strategy": "drain",
  "regions": { "iad": "draining", "fra": "queued" }
}
```
