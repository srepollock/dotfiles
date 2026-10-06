import type { ContextCategory, SessionContextBreakdown } from 'claude-code'

import type { Segment, SegmentKind, Snapshot } from '../types'

const GLYPHS: Record<SegmentKind, string> = { used: '█', free: '░', buffer: '▒' }

export function glyphFor(kind: SegmentKind): string {
  return GLYPHS[kind]
}

function isOnGrid(
  category: ContextCategory,
): category is ContextCategory & { kind: SegmentKind } {
  return category.kind !== 'deferred' && category.tokens > 0
}

export function toSnapshot(breakdown: SessionContextBreakdown): Snapshot {
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
  }
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
