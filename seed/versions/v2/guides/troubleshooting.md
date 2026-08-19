---
title: Troubleshooting
section: Guides
---

# Troubleshooting

![Following a sync through the pipeline](./images/flow.jpg)

**`no nimbus.toml found`.** 0.5 needs a project file. Run `nimbus init` or point
at one explicitly:

```bash
nimbus sync --config ./path/to/nimbus.toml
```

**`401 unauthorized` on deploy.** The API key is missing or wrong. Confirm it is
set for the current shell:

```bash
echo "${NIMBUS_KEY:0:6}…"   # nk_liv…
```

**Deploy is slow.** Raise the worker count with `concurrency` in `nimbus.toml`
or `NIMBUS_PROJECT__CONCURRENCY`.
