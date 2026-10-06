import type { ContextCategory, SessionContextBreakdown, SessionRateLimit } from 'claude-code'

import type { Segment, SegmentKind, Snapshot } from '../types'

const GLYPHS: Record<SegmentKind, string> = { used: '█', free: '░', buffer: '▒' }

const RATE_LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: '$',
}

export function glyphFor(kind: SegmentKind): string {
  return GLYPHS[kind]
}

function isOnGrid(
  category: ContextCategory,
): category is ContextCategory & { kind: SegmentKind } {
  return category.kind !== 'deferred' && category.tokens > 0
}

export function toSnapshot(
  breakdown: SessionContextBreakdown,
  rateLimits: readonly SessionRateLimit[],
): Snapshot {
  return {
    segments: breakdown.categories.filter(isOnGrid).map(category => ({
      name: category.name,
      color: category.color,
      tokens: category.tokens,
      kind: category.kind,
    })),
    totalTokens: breakdown.totalTokens,
    maxTokens: breakdown.rawMaxTokens,
    percentage: breakdown.percentage,
    rateLimits: rateLimits.map(limit => ({
      kind: limit.kind,
      percentUsed: limit.percentUsed,
      resetsAt: limit.resetsAt,
    })),
  }
}

export function rateLabel(kind: string): string {
  return RATE_LABELS[kind] ?? kind
}

/** A short "time until reset" from an ISO timestamp, e.g. `3h`, `2h15m`, `6d4h`. */
export function formatReset(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const ms = new Date(resetsAt).getTime() - now
  if (!Number.isFinite(ms) || ms <= 0) return 'now'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  if (hours < 24) return restMinutes ? `${hours}h${restMinutes}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d${hours % 24}h`
}

/**
 * Splits `width` cells across the segments in proportion to their tokens.
 * The cells always sum to `width`, and every segment gets at least one cell
 * while there are enough cells to go round, so a small category stays visible.
 * Shares are taken against the segments' own sum rather than the window, so a
 * breakdown that runs past the window still fills the bar exactly.
 */
export function allocate(segments: readonly Segment[], width: number): number[] {
  const total = segments.reduce((sum, segment) => sum + segment.tokens, 0)
  if (total === 0 || width <= 0) {
    return segments.map(() => 0)
  }

  const exact = segments.map(segment => (segment.tokens / total) * width)
  const cells = exact.map(Math.floor)

  if (segments.length <= width) {
    cells.forEach((count, i) => {
      if (count === 0) cells[i] = 1
    })
  }

  let remaining = width - sum(cells)
  const byRemainder = exact
    .map((value, i) => ({ i, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)
  for (let k = 0; remaining > 0; k = (k + 1) % byRemainder.length) {
    cells[byRemainder[k]!.i]! += 1
    remaining -= 1
  }

  while (remaining < 0) {
    const largest = cells.indexOf(Math.max(...cells))
    cells[largest]! -= 1
    remaining += 1
  }

  return cells
}

function sum(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${trim(tokens / 1_000_000)}M`
  if (tokens >= 1_000) return `${trim(tokens / 1_000)}k`
  return String(tokens)
}

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}

export function summaryText(snapshot: Snapshot): string {
  return ` ${formatTokens(snapshot.totalTokens)}/${formatTokens(snapshot.maxTokens)} ${snapshot.percentage}%`
}
