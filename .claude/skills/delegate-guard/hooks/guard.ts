import type { FiredKind, SessionIdentity, SessionRecord, TurnState } from '../types'

export type Thresholds = {
  outputChars: number
  distinctFiles: number
  searchCalls: number
  editFiles: number
}

export type GuardCall = {
  tool: string
  filePath?: string
  command?: string
  model?: string
  subagentType?: string
  isReadOnly: boolean
  outputChars: number
}

export type Observation = {
  state: TurnState
  reminders: string[]
}

export const MAX_SESSIONS = 50
export const KINDS: readonly FiredKind[] = ['volume', 'breadth-files', 'breadth-search', 'edits']

const READ_ONLY_BY_NATURE = new Set(['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch'])
const SEARCH_TOOLS = new Set(['Grep', 'Glob'])
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])
const DELEGATE_TOOLS = new Set(['Agent', 'Task'])
const SEARCH_COMMAND = /^(grep|rg|ag|find|fd|git\s+grep|git\s+ls-files|ls\s+-[a-zA-Z]*R)\b/

// Checks each `&&`/`;`/`||`-chained segment so `cd repo && rg foo` counts; a pipe
// stays one segment, since `... | grep` filters output rather than sweeping files.
function isSearchCommand(command: string): boolean {
  return command.split(/&&|\|\||;/).some(segment => SEARCH_COMMAND.test(segment.trim()))
}

export const MODEL_REMINDER =
  'delegate-guard: Agent dispatched without `model:` — set it per the tier table (haiku for sweeps/extraction, sonnet for well-specified implementation, inherit only for frontier work).'

export function initialTurnState(): TurnState {
  return {
    outputChars: 0,
    filesRead: [],
    searchCalls: 0,
    filesEdited: [],
    firedKinds: [],
    nudged: false,
    delegations: 0,
    followed: false,
  }
}

export function isMainLoop(e: { agentId?: string }): boolean {
  return e.agentId === undefined
}

function withPath(paths: readonly string[], path: string | undefined): string[] {
  if (path === undefined || path === '' || paths.includes(path)) return [...paths]
  return [...paths, path]
}

function thousands(chars: number): string {
  return `${Math.round(chars / 1000)}k`
}

function reminderFor(kind: FiredKind, state: TurnState): string {
  switch (kind) {
    case 'volume':
      return `delegate-guard: ~${thousands(state.outputChars)} chars of tool output in the main thread this turn. If what remains is extraction or a sweep, hand it to a haiku/sonnet subagent and keep only its conclusion. If this is live debugging that needs this context, continue inline.`
    case 'breadth-files':
      return `delegate-guard: ${state.filesRead.length} distinct files read directly this turn. Delegate further exploration to an Explore subagent (model: haiku) with a precise question; keep the conclusion, not the file dumps.`
    case 'breadth-search':
      return `delegate-guard: ${state.searchCalls} search calls (Grep/Glob/find) run directly this turn. Delegate the remaining sweep to an Explore subagent (model: haiku) with a precise question; keep the conclusion, not the match lists.`
    case 'edits':
      return `delegate-guard: edits now span ${state.filesEdited.length} files this turn. If the remaining implementation is well-specified, hand it to a sonnet implementer with a written brief (goal, files, constraints, return shape).`
  }
}

function crossed(kind: FiredKind, state: TurnState, thresholds: Thresholds): boolean {
  switch (kind) {
    case 'volume':
      return state.outputChars > thresholds.outputChars
    case 'breadth-files':
      return state.filesRead.length >= thresholds.distinctFiles
    case 'breadth-search':
      return state.searchCalls >= thresholds.searchCalls
    case 'edits':
      return state.filesEdited.length >= thresholds.editFiles
  }
}

export function observe(state: TurnState, call: GuardCall, thresholds: Thresholds): Observation {
  const reminders: string[] = []
  let next: TurnState = { ...state }

  if (DELEGATE_TOOLS.has(call.tool)) {
    next = { ...next, delegations: next.delegations + 1, followed: next.followed || next.nudged }
    const hasNoModel = call.model === undefined || call.model === ''
    const isGeneric = call.subagentType === undefined || call.subagentType === 'general-purpose'
    if (hasNoModel && isGeneric) reminders.push(MODEL_REMINDER)
  } else {
    if (call.tool === 'Read') {
      next = { ...next, filesRead: withPath(next.filesRead, call.filePath) }
    } else if (SEARCH_TOOLS.has(call.tool)) {
      next = { ...next, searchCalls: next.searchCalls + 1 }
    } else if (call.tool === 'Bash' && call.isReadOnly && isSearchCommand(call.command ?? '')) {
      next = { ...next, searchCalls: next.searchCalls + 1 }
    } else if (EDIT_TOOLS.has(call.tool)) {
      next = { ...next, filesEdited: withPath(next.filesEdited, call.filePath) }
    }

    if (call.isReadOnly || READ_ONLY_BY_NATURE.has(call.tool)) {
      next = { ...next, outputChars: next.outputChars + call.outputChars }
    }
  }

  for (const kind of KINDS) {
    if (next.firedKinds.includes(kind) || !crossed(kind, next, thresholds)) continue
    next = { ...next, firedKinds: [...next.firedKinds, kind], nudged: true }
    reminders.push(reminderFor(kind, next))
  }

  return { state: next, reminders }
}

export function formatStatus(state: TurnState): string {
  const out = state.outputChars >= 1000 ? thousands(state.outputChars) : String(state.outputChars)
  return `dg ${out}·${state.filesRead.length}f·${state.searchCalls}s·${state.delegations}↗`
}

export function emptySession(identity: SessionIdentity): SessionRecord {
  return {
    id: identity.id,
    startedAt: identity.startedAt,
    cwd: identity.cwd,
    turns: 0,
    nudgesByKind: { volume: 0, 'breadth-files': 0, 'breadth-search': 0, edits: 0 },
    nudgedTurns: 0,
    followedTurns: 0,
    delegations: 0,
    peakOutputChars: 0,
  }
}

export function foldTurn(session: SessionRecord, turn: TurnState): SessionRecord {
  const nudgesByKind = { ...session.nudgesByKind }
  for (const kind of turn.firedKinds) nudgesByKind[kind] += 1
  return {
    ...session,
    turns: session.turns + 1,
    nudgesByKind,
    nudgedTurns: session.nudgedTurns + (turn.nudged ? 1 : 0),
    followedTurns: session.followedTurns + (turn.nudged && turn.followed ? 1 : 0),
    delegations: session.delegations + turn.delegations,
    peakOutputChars: Math.max(session.peakOutputChars, turn.outputChars),
  }
}

export function upsertSession(
  sessions: readonly SessionRecord[],
  identity: SessionIdentity,
  turn: TurnState,
  max: number = MAX_SESSIONS,
): SessionRecord[] {
  const existing = sessions.find(s => s.id === identity.id)
  const updated = foldTurn(existing ?? emptySession(identity), turn)
  const rest = sessions.filter(s => s.id !== identity.id)
  return [...rest, updated].slice(-max)
}

export function totalNudges(session: SessionRecord): number {
  return KINDS.reduce((sum, kind) => sum + session.nudgesByKind[kind], 0)
}

export type StatsTotals = {
  turns: number
  nudges: number
  nudgedTurns: number
  followedTurns: number
  delegations: number
  followRate: number | null
  nudgesPerTurn: number | null
}

export function totalsOf(sessions: readonly SessionRecord[]): StatsTotals {
  const turns = sessions.reduce((sum, s) => sum + s.turns, 0)
  const nudges = sessions.reduce((sum, s) => sum + totalNudges(s), 0)
  const nudgedTurns = sessions.reduce((sum, s) => sum + s.nudgedTurns, 0)
  const followedTurns = sessions.reduce((sum, s) => sum + s.followedTurns, 0)
  const delegations = sessions.reduce((sum, s) => sum + s.delegations, 0)
  return {
    turns,
    nudges,
    nudgedTurns,
    followedTurns,
    delegations,
    followRate: nudgedTurns === 0 ? null : followedTurns / nudgedTurns,
    nudgesPerTurn: turns === 0 ? null : nudges / turns,
  }
}

function sessionLabel(session: SessionRecord): string {
  const when = new Date(session.startedAt).toISOString().slice(0, 16).replace('T', ' ')
  const dir = session.cwd ? (session.cwd.split('/').filter(Boolean).pop() ?? '') : ''
  return dir ? `${when} ${dir}` : when
}

export function formatStats(sessions: readonly SessionRecord[], count: number): string {
  if (sessions.length === 0) return 'delegate-guard: no sessions recorded yet.'
  const shown = sessions.slice(-Math.max(1, count))
  const header = ['session', 'turns', 'nudges', 'nudged', 'followed', 'deleg', 'peak']
  const rows = shown.map(s => [
    sessionLabel(s),
    String(s.turns),
    String(totalNudges(s)),
    String(s.nudgedTurns),
    String(s.followedTurns),
    String(s.delegations),
    thousands(s.peakOutputChars),
  ])
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] ?? '').length)))
  const line = (cells: readonly string[]): string =>
    cells.map((c, i) => (i === 0 ? c.padEnd(widths[i] ?? 0) : c.padStart(widths[i] ?? 0))).join('  ')

  const totals = totalsOf(shown)
  const rate = totals.followRate === null ? 'n/a' : `${Math.round(totals.followRate * 100)}% (${totals.followedTurns}/${totals.nudgedTurns})`
  const perTurn = totals.nudgesPerTurn === null ? 'n/a' : totals.nudgesPerTurn.toFixed(2)

  return [
    `delegate-guard: last ${shown.length} of ${sessions.length} sessions`,
    line(header),
    ...rows.map(line),
    '',
    `totals (shown): ${totals.turns} turns, ${totals.nudges} nudges, ${totals.delegations} delegations`,
    `nudge-follow rate: ${rate}`,
    `nudges per turn: ${perTurn}`,
  ].join('\n')
}
