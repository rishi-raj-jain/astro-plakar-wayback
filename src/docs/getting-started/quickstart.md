---
title: Quickstart
section: Getting started
---

# Quickstart

Watch the 2.0 launch tour, then ship your first edge function.

<div class="embed embed-video"><iframe src="https://www.youtube.com/embed/jNQXAC9IVRw" title="Nimbus 2.0 launch" allowfullscreen loading="lazy"></iframe></div>
<p class="embed-caption">Placeholder video. Swap in your product walkthrough.</p>

Scaffold a project and run it live:

```bash
nimbus init
nimbus run --watch
```

Add an edge function, a small handler that runs at every region:

```ts
// functions/hello.ts
import type { EdgeRequest } from '@nimbus/sdk'

export default function (req: EdgeRequest) {
  return new Response(`hello from ${req.region}`)
}
```

Deploy it everywhere with one command:

```bash
nimbus deploy --remote edge
```

Or from your own code:

```python
from nimbus import Nimbus

nimbus = Nimbus(key=os.environ["NIMBUS_KEY"])
nimbus.deploy(source="docs", functions="./functions", strategy="drain")
```
