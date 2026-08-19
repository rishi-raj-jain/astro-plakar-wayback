---
title: API reference
section: Reference
---

# API reference

Nimbus 0.1 has no HTTP API. It is a command-line tool only.

If you want to script it, call the binary and check its exit code:

```bash
if nimbus sync ./data ./out --dry-run; then
  echo "in sync"
else
  echo "changes pending"
fi
```

Exit codes:

- `0`: source and destination already match
- `1`: changes were applied (or would be, with `--dry-run`)
- `2`: an error occurred

A proper REST API is planned for the 1.0 release.
