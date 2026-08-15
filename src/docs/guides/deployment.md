---
title: Deployment
section: Guides
---
# Deployment

Deploy Nimbus as a single binary. Copy it to your server and run it under a
process manager such as systemd.

## Zero downtime

As of version 4 you can run two instances behind a load balancer and drain one
at a time during upgrades.
