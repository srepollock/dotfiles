export type SegmentKind = 'used' | 'free' | 'buffer'

export type Segment = {
  name: string
  color: string
  tokens: number
  kind: SegmentKind
}

export type RateLimit = {
  kind: string
  percentUsed: number
  resetsAt?: string
}

export type Snapshot = {
  segments: Segment[]
  totalTokens: number
  maxTokens: number
  percentage: number
  rateLimits: RateLimit[]
}

declare module 'claude-code' {
  interface PluginState {
    'context-bar': { snapshot: Snapshot | null; isVisible: boolean }
  }
}
