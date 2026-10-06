export type FiredKind = 'volume' | 'breadth-files' | 'breadth-search' | 'edits'

export type TurnState = {
  outputChars: number
  filesRead: string[]
  searchCalls: number
  filesEdited: string[]
  firedKinds: FiredKind[]
  nudged: boolean
  delegations: number
  followed: boolean
}

export type SessionRecord = {
  id: string
  startedAt: number
  cwd: string | null
  turns: number
  nudgesByKind: Record<FiredKind, number>
  nudgedTurns: number
  followedTurns: number
  delegations: number
  peakOutputChars: number
}

export type SessionIdentity = {
  id: string
  startedAt: number
  cwd: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'delegate-guard': {
      turn: TurnState
      isEnabled: boolean | null
      session: SessionIdentity | null
    }
  }
}
