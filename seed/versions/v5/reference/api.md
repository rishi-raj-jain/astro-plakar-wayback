---
title: API reference
section: Reference
---

# API reference

The 2.0 REST API adds releases and functions. Authenticate with a bearer key or
a short-lived, role-scoped token.

| Method   | Path              | Description                       |
| -------- | ----------------- | --------------------------------- |
| `GET`    | `/status`         | node health and current release   |
| `GET`    | `/manifest`       | files currently served            |
| `GET`    | `/releases`       | immutable release history         |
| `GET`    | `/metrics`        | Prometheus metrics                |
| `POST`   | `/run`            | deploy a new release              |
| `POST`   | `/rollback`       | serve a previous release          |
| `GET`    | `/functions`      | deployed edge functions           |

## Example: deploy a release

```bash
curl -X POST https://edge.nimbus.dev/run \
  -H "Authorization: Bearer $NIMBUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "source": "docs",
        "functions": ["hello"],
        "strategy": "drain",
        "regions": ["iad", "fra", "sin"]
      }'
```

```json
{
  "release": "rel_9f2a",
  "strategy": "drain",
  "functions": ["hello"],
  "regions": { "iad": "draining", "fra": "queued", "sin": "queued" }
}
```
