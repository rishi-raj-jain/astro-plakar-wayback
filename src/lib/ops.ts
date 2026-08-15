// Records the Plakar commands a page runs to fetch its content, with the time
// each one took and the bytes it returned, so the page can show what the backend
// did.
//
// The commands run on the server while the page renders. The browser reveals the
// logged entries one at a time on load. It does not re-run them, so the timings
// and byte counts are the values measured on the server.

export interface Op {
  command: string
  detail: string
  ms: number
  bytes: number
}

export interface OpSummary {
  detail?: string
  bytes?: number
}

export class Ops {
  entries: Op[] = []

  private record<T>(command: string, result: T, start: number, summarize?: (result: T) => OpSummary): Op {
    const ms = Math.max(1, Math.round(performance.now() - start))
    const { detail = '', bytes = 0 } = summarize ? summarize(result) : {}
    const op: Op = { command, detail, ms, bytes }
    this.entries.push(op)
    return op
  }

  /** Time a unit of work and record it. */
  run<T>(command: string, fn: () => T, summarize?: (result: T) => OpSummary): T {
    const start = performance.now()
    const result = fn()
    this.record(command, result, start, summarize)
    return result
  }

  /** Time an async unit of work and record it. Returns the recorded Op too. */
  async runAsync<T>(command: string, fn: () => Promise<T>, summarize?: (result: T) => OpSummary): Promise<{ result: T; op: Op }> {
    const start = performance.now()
    const result = await fn()
    return { result, op: this.record(command, result, start, summarize) }
  }

  totals() {
    return {
      count: this.entries.length,
      ms: this.entries.reduce((n, e) => n + e.ms, 0),
      bytes: this.entries.reduce((n, e) => n + e.bytes, 0),
    }
  }
}

/** A plain-English label for a command, shown on the collapsed accordion row. */
export function describeOp(o: Op): string {
  const p = o.command.split(/\s+/)
  if (p[0] === 'plakar') {
    const verb = p[3]
    if (verb === 'ls') return 'Listed snapshots'
    if (verb === 'locate') return 'Located matching files'
    if (verb === 'restore') return o.detail.startsWith('reused') ? 'Reused decrypted snapshot' : 'Decrypted snapshot'
    if (verb === 'cat') {
      const target = p[p.length - 1]
      const path = target.includes(':') ? target.slice(target.indexOf(':') + 1) : target
      const name = path.split('/').pop() || path
      return `${o.detail === 'binary' ? 'Retrieved' : 'Read'} ${name}`
    }
  }
  if (p[0] === 'read') {
    const name = (p[1] ?? '').split('/').pop() || p[1] || ''
    return `Read ${name}`
  }
  return o.command
}

/** Human byte formatting for the UI. */
export function fmtBytes(n: number): string {
  if (!n) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}
