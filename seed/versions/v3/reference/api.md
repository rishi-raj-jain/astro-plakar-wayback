---
title: API reference
section: Reference
---

# API reference

The 1.0 REST API is stable. All endpoints require a bearer token.

| Method | Path        | Description                    |
| ------ | ----------- | ------------------------------ |
| `GET`  | `/status`   | node health and last deploy    |
| `GET`  | `/manifest` | files currently served         |
| `GET`  | `/audit`    | signed deploy history          |
| `POST` | `/run`      | trigger a deploy               |

## Example: trigger a deploy

```bash
curl -X POST https://edge.nimbus.dev/run \
  -H "Authorization: Bearer $NIMBUS_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "docs", "regions": ["iad"]}'
```

Response:

```json
{
  "deploy": "dpl_5f3a",
  "regions": { "iad": "queued" },
  "manifest": "mf_91c2"
}
```
