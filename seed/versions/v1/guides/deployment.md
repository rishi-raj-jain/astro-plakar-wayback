---
title: Deployment
section: Guides
---

# Deployment

There is no server to deploy in 0.1. Nimbus runs on your machine as a one-shot
command.

If you want it to run on a schedule, wire the binary into `cron`:

```cron
*/15 * * * * /usr/local/bin/nimbus sync /srv/data /srv/out
```

A long-running service with a proper scheduler is on the roadmap.
