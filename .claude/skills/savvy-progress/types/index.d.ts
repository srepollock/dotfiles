export type Phase = 'running' | 'completed' | 'failed'

export type AgentRow = {
  id: string
  description: string
  type: string
  model: string
  effort: string | null
  phase: Phase
  startedAt: number
  endedAt: number | null
  tokens: number
  contextTokens: number
  order: number
}

export type SessionTotals = {
  costUsd: number | null
  startedAt: number
  contextWindow: number
}

declare module 'claude-code' {
  interface PluginState {
    'savvy-progress': {
      agents: Record<string, AgentRow>
      totals: SessionTotals | null
      sessionTokens: number
      now: number
      isVisible: boolean
      isCompletedCollapsed: boolean
    }
  }
}
