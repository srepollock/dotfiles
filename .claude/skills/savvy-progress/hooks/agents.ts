import type { AgentStatus, ModelUsage, ThemeKey } from 'claude-code'

import type { AgentRow, Phase } from '../types'

export type Agents = Record<string, AgentRow>

export type Weight = { label: string; color: ThemeKey }

const WEIGHTS: Record<string, Weight> = {
  max: { label: 'heavy', color: 'error' },
  xhigh: { label: 'heavy', color: 'error' },
  high: { label: 'careful', color: 'warning' },
  medium: { label: 'medium', color: 'suggestion' },
  low: { label: 'light', color: 'success' },
}

const UNKNOWN_WEIGHT: Weight = { label: 'default', color: 'inactive' }

export function weightOf(effort: string | null): Weight {
  return (effort && WEIGHTS[effort]) || UNKNOWN_WEIGHT
}

export function totalTokens(usage: ModelUsage): number {
  return (
    usage.input_tokens +
    usage.output_tokens +
    usage.cache_read_input_tokens +
    usage.cache_creation_input_tokens
  )
}

export function contextTokens(usage: ModelUsage): number {
  return usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens
}

export type Spawned = {
  id: string
  description: string
  type: string
  model: string
  startedAt: number
}

export function addAgent(agents: Agents, spawned: Spawned): Agents {
  const order = Object.keys(agents).length + 1
  return {
    ...agents,
    [spawned.id]: {
      ...spawned,
      effort: null,
      phase: 'running',
      endedAt: null,
      tokens: 0,
      contextTokens: 0,
      order,
    },
  }
}

export type Step = { model: string; effort: string | null; usage: ModelUsage | null }

/**
 * A step from an agent this mod never saw spawn (spawned before a reload, or
 * by a plugin whose spawns skip our hook) is ignored rather than invented.
 */
export function recordStep(agents: Agents, id: string, step: Step): Agents {
  const row = agents[id]
  if (!row) return agents

  return {
    ...agents,
    [id]: {
      ...row,
      model: step.model,
      effort: step.effort ?? row.effort,
      phase: 'running',
      endedAt: null,
      tokens: row.tokens + (step.usage ? totalTokens(step.usage) : 0),
      contextTokens: step.usage ? contextTokens(step.usage) : row.contextTokens,
    },
  }
}

export function finishAgent(agents: Agents, id: string, phase: Exclude<Phase, 'running'>, at: number): Agents {
  const row = agents[id]
  if (!row || row.phase !== 'running') return agents

  return { ...agents, [id]: { ...row, phase, endedAt: at } }
}

/** Maps the engine's status to ours; undefined while it is still live. */
export function settledPhase(status: AgentStatus): Exclude<Phase, 'running'> | undefined {
  if (status === 'completed' || status === 'idle') return 'completed'
  if (status === 'failed' || status === 'killed') return 'failed'
  return undefined
}

export function byPhase(agents: Agents): Record<Phase, AgentRow[]> {
  const sorted = Object.values(agents).sort((a, b) => a.order - b.order)
  return {
    running: sorted.filter(row => row.phase === 'running'),
    completed: sorted.filter(row => row.phase === 'completed'),
    failed: sorted.filter(row => row.phase === 'failed'),
  }
}

export function hasRunning(agents: Agents): boolean {
  return Object.values(agents).some(row => row.phase === 'running')
}

/** `claude-opus-5-5` → `Opus 5.5`, `claude-haiku-4-5-20251001` → `Haiku 4.5`. */
export function modelName(model: string): string {
  const bare = model
    .replace(/\[.*\]$/, '')
    .replace(/^claude-/, '')
    .replace(/-\d{8}$/, '')
  const [family, ...version] = bare.split('-')
  if (!family) return model

  const name = family.charAt(0).toUpperCase() + family.slice(1)
  const digits = version.filter(part => /^\d+$/.test(part))
  return digits.length > 0 ? `${name} ${digits.join('.')}` : name
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}k`
  return String(tokens)
}

export function formatCost(usd: number | null): string {
  if (usd === null) return '—'
  return usd >= 10 ? `≈$${usd.toFixed(1)}` : `≈$${usd.toFixed(2)}`
}

export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.min(100, Math.round((part / whole) * 100))
}

export function cellsFor(percent: number, width: number): number {
  return Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
}

/**
 * Splits the band's bar into finished (completed, failed) cells and the
 * still-running remainder; the three always sum to the width.
 */
export function progressCells(
  counts: { completed: number; running: number; failed: number },
  width: number,
): { completed: number; failed: number; running: number } {
  const total = counts.completed + counts.running + counts.failed
  if (total === 0 || width <= 0) return { completed: 0, failed: 0, running: Math.max(0, width) }

  const completed = Math.floor((counts.completed / total) * width)
  const failed = Math.floor((counts.failed / total) * width)
  const running = counts.running > 0 ? width - completed - failed : 0
  return { completed: width - failed - running, failed, running }
}
