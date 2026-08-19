---
title: Quickstart
section: Getting started
---

# Quickstart

New to Nimbus? Watch the two-minute tour, then follow along below.

<div class="embed embed-video"><iframe src="https://www.youtube.com/embed/jNQXAC9IVRw" title="Nimbus in two minutes" allowfullscreen loading="lazy"></iframe></div>
<p class="embed-caption">Placeholder video. Swap in your product walkthrough.</p>

Initialise and run a live sync that re-deploys on every change:

```bash
nimbus init
nimbus run --watch
```

`--watch` is new in 1.0: Nimbus watches the source, syncs incrementally, and
pushes to your remotes whenever a file changes.

Prefer code? The SDK does the same thing:

```js
import { Nimbus } from '@nimbus/sdk'

const nimbus = new Nimbus({ key: process.env.NIMBUS_KEY })
await nimbus.watch({ source: './data', remote: 'edge-1' })
```
