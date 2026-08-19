---
title: Deployment
section: Guides
---

# Deployment

## Zero downtime

1.5 deploys drain by default. Two instances run behind the region's load
balancer and are replaced one at a time:

```bash
nimbus deploy --remote edge --strategy drain
```

## Observability

Every deploy now emits OpenTelemetry traces and Prometheus metrics. Point them
at your collector:

```toml
[telemetry]
otlp_endpoint = "http://otel-collector:4317"
metrics = true
```

Scrape the node directly if you prefer:

```bash
curl https://edge.nimbus.dev/metrics
# nimbus_deploy_duration_seconds{region="iad"} 3.2
# nimbus_active_instances{region="iad"} 2
```
