---
title: Deployment
section: Guides
---

# Deployment

0.5 introduces remote destinations, so "deploy" now means pushing your synced
output to a Nimbus edge node.

Register a remote in `nimbus.toml`, then:

```bash
nimbus deploy --remote edge-1
```

Run it from CI by setting the API key in the environment:

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: curl -fsSL https://get.nimbus.dev/install.sh | sh
      - run: nimbus deploy --remote edge-1
        env:
          NIMBUS_KEY: ${{ secrets.NIMBUS_KEY }}
```

There is a single node per remote for now. Multi-region rollout lands in 1.0.
