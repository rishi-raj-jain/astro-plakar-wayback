---
title: Quickstart
section: Getting started
---

# Quickstart

Watch the overview, then set up a project with zero-downtime deploys.

<div class="embed embed-video"><iframe src="https://www.youtube.com/embed/jNQXAC9IVRw" title="Nimbus 1.5 overview" allowfullscreen loading="lazy"></iframe></div>
<p class="embed-caption">Placeholder video. Swap in your product walkthrough.</p>

```bash
nimbus init
nimbus run --watch
```

The same flow from each SDK:

```ts
// TypeScript
import { Nimbus } from '@nimbus/sdk'
const nimbus = new Nimbus({ key: process.env.NIMBUS_KEY })
await nimbus.deploy({ source: 'docs', strategy: 'drain' })
```

```python
# Python
from nimbus import Nimbus
nimbus = Nimbus(key=os.environ["NIMBUS_KEY"])
nimbus.deploy(source="docs", strategy="drain")
```

```go
// Go
n := nimbus.New(os.Getenv("NIMBUS_KEY"))
n.Deploy(ctx, nimbus.Deploy{Source: "docs", Strategy: "drain"})
```

`strategy: "drain"` is the 1.5 default: old instances finish in-flight requests
before they are retired.
