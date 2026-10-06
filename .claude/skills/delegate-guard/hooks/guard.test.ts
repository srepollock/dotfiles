import { describe, expect, test } from 'claude-code/testing'

import {
  MODEL_REMINDER,
  emptySession,
  foldTurn,
  formatStats,
  formatStatus,
  initialTurnState,
  isMainLoop,
  observe,
  totalsOf,
  upsertSession,
} from './guard'
import type { GuardCall, Thresholds } from './guard'
import type { TurnState } from '../types'

const THRESHOLDS: Thresholds = { outputChars: 40_000, distinctFiles: 6, searchCalls: 6, editFiles: 3 }

function call(overrides: Partial<GuardCall> & { tool: string }): GuardCall {
  return { isReadOnly: false, outputChars: 0, ...overrides }
}

function run(calls: readonly GuardCall[], thresholds: Thresholds = THRESHOLDS): { state: TurnState; reminders: string[][] } {
  let state = initialTurnState()
  const reminders: string[][] = []
  for (const c of calls) {
    const observed = observe(state, c, thresholds)
    state = observed.state
    reminders.push(observed.reminders)
  }
  return { state, reminders }
}

const read = (path: string, chars = 100): GuardCall => call({ tool: 'Read', filePath: path, outputChars: chars })

describe('observe', () => {
  test('below every threshold produces no reminders', () => {
    const { reminders, state } = run([read('/a'), read('/b'), call({ tool: 'Grep', outputChars: 50 }), call({ tool: 'Edit', filePath: '/a' })])
    expect(reminders.flat()).toHaveLength(0)
    expect(state.nudged).toBe(false)
  })

  test('six distinct reads fire breadth-files once; a seventh does not re-fire', () => {
    const paths = ['/1', '/2', '/3', '/4', '/5', '/6', '/7']
    const { reminders, state } = run(paths.map(p => read(p)))
    expect(reminders.slice(0, 5).flat()).toHaveLength(0)
    expect(reminders[5]).toHaveLength(1)
    expect(reminders[5]?.[0]).toContain('6 distinct files read directly')
    expect(reminders[6]).toHaveLength(0)
    expect(state.firedKinds).toEqual(['breadth-files'])
    expect(state.nudged).toBe(true)
  })

  test('reading the same file six times does not fire', () => {
    const { reminders, state } = run(Array.from({ length: 6 }, () => read('/same')))
    expect(reminders.flat()).toHaveLength(0)
    expect(state.filesRead).toEqual(['/same'])
  })

  test('six Grep and Glob calls fire breadth-search once', () => {
    const tools = ['Grep', 'Glob', 'Grep', 'Glob', 'Grep', 'Glob', 'Grep']
    const { reminders } = run(tools.map(tool => call({ tool })))
    expect(reminders[5]).toHaveLength(1)
    expect(reminders[5]?.[0]).toContain('6 search calls')
    expect(reminders[6]).toHaveLength(0)
  })

  test('read-only Bash search commands count as searches; mutating ones do not', () => {
    const searches = ['grep -rn foo .', 'rg foo', 'find . -name x', 'fd x', 'ls -lR src', '  rg bar']
    const counted = run(searches.map(command => call({ tool: 'Bash', command, isReadOnly: true })))
    expect(counted.state.searchCalls).toBe(6)
    expect(counted.reminders[5]).toHaveLength(1)

    const mutating = run(searches.map(command => call({ tool: 'Bash', command, isReadOnly: false })))
    expect(mutating.state.searchCalls).toBe(0)

    const plain = run([call({ tool: 'Bash', command: 'ls -l', isReadOnly: true }), call({ tool: 'Bash', command: 'cat x', isReadOnly: true })])
    expect(plain.state.searchCalls).toBe(0)
  })

  test('chained and git search commands count; piped filters do not', () => {
    const chained = ['cd repo && rg foo', 'git grep -n bar', 'git ls-files src', 'cd a; find . -name y', 'ag baz']
    expect(run(chained.map(command => call({ tool: 'Bash', command, isReadOnly: true }))).state.searchCalls).toBe(5)

    const filtered = ['git log --oneline | grep fix', 'gh run view 1 --log | rg error']
    expect(run(filtered.map(command => call({ tool: 'Bash', command, isReadOnly: true }))).state.searchCalls).toBe(0)
  })

  test('one 45k-char read-only result fires volume once', () => {
    const big = call({ tool: 'Bash', command: 'cat big.log', isReadOnly: true, outputChars: 45_000 })
    const { reminders, state } = run([big, big])
    expect(reminders[0]).toHaveLength(1)
    expect(reminders[0]?.[0]).toContain('~45k chars of tool output')
    expect(reminders[1]).toHaveLength(0)
    expect(state.firedKinds).toEqual(['volume'])
  })

  test('volume uses a strict greater-than', () => {
    const { reminders } = run([call({ tool: 'Grep', outputChars: 40_000 })])
    expect(reminders.flat()).toHaveLength(0)
  })

  test('Read, Grep and Glob output counts even when isReadOnly is absent', () => {
    const { state } = run([call({ tool: 'Read', filePath: '/a', outputChars: 10 }), call({ tool: 'Grep', outputChars: 20 }), call({ tool: 'WebFetch', outputChars: 30 })])
    expect(state.outputChars).toBe(60)
  })

  test('a debug loop of mutating Bash plus two edits of one file never fires', () => {
    const loop = Array.from({ length: 10 }, () => call({ tool: 'Bash', command: 'yarn test', outputChars: 500 }))
    const { reminders, state } = run([...loop, call({ tool: 'Edit', filePath: '/a' }), call({ tool: 'Edit', filePath: '/a' })])
    expect(reminders.flat()).toHaveLength(0)
    expect(state.outputChars).toBe(0)
    expect(state.searchCalls).toBe(0)
    expect(state.filesEdited).toEqual(['/a'])
  })

  test('the third distinct edited file fires edits, across Edit, Write and NotebookEdit', () => {
    const { reminders } = run([
      call({ tool: 'Edit', filePath: '/a' }),
      call({ tool: 'Write', filePath: '/b' }),
      call({ tool: 'NotebookEdit', filePath: '/c.ipynb' }),
      call({ tool: 'Edit', filePath: '/d' }),
    ])
    expect(reminders[1]).toHaveLength(0)
    expect(reminders[2]).toHaveLength(1)
    expect(reminders[2]?.[0]).toContain('edits now span 3 files')
    expect(reminders[3]).toHaveLength(0)
  })

  test('several kinds crossing in one call all fire, each once', () => {
    const lowered: Thresholds = { outputChars: 100, distinctFiles: 1, searchCalls: 1, editFiles: 1 }
    const { reminders, state } = run([read('/a', 500)], lowered)
    expect(reminders[0]).toHaveLength(2)
    expect(state.firedKinds).toEqual(['volume', 'breadth-files'])
  })

  test('Agent after a nudge marks followed; before a nudge it does not', () => {
    const before = run([call({ tool: 'Agent', model: 'haiku' })])
    expect(before.state.delegations).toBe(1)
    expect(before.state.followed).toBe(false)

    const after = run([...Array.from({ length: 6 }, (_, i) => read(`/f${i}`)), call({ tool: 'Task', model: 'haiku' })])
    expect(after.state.nudged).toBe(true)
    expect(after.state.followed).toBe(true)
    expect(after.state.delegations).toBe(1)
  })

  test('Agent without model and generic type gets the tier reminder', () => {
    expect(run([call({ tool: 'Agent' })]).reminders[0]).toEqual([MODEL_REMINDER])
    expect(run([call({ tool: 'Agent', subagentType: 'general-purpose' })]).reminders[0]).toEqual([MODEL_REMINDER])
  })

  test('Agent with a model, or a specific type, gets no tier reminder', () => {
    expect(run([call({ tool: 'Agent', model: 'haiku' })]).reminders[0]).toEqual([])
    expect(run([call({ tool: 'Agent', subagentType: 'Explore' })]).reminders[0]).toEqual([])
  })

  test('Agent results do not count toward output volume', () => {
    const { state } = run([call({ tool: 'Agent', model: 'haiku', isReadOnly: true, outputChars: 90_000 })])
    expect(state.outputChars).toBe(0)
  })

  test('does not mutate the state it is given', () => {
    const state = initialTurnState()
    observe(state, read('/a'), THRESHOLDS)
    expect(state).toEqual(initialTurnState())
  })
})

describe('helpers', () => {
  test('isMainLoop is false when agentId is set', () => {
    expect(isMainLoop({})).toBe(true)
    expect(isMainLoop({ agentId: 'agent-1' })).toBe(false)
  })

  test('status line is compact', () => {
    const state: TurnState = { ...initialTurnState(), outputChars: 31_000, filesRead: ['a', 'b', 'c', 'd'], searchCalls: 2, delegations: 1 }
    expect(formatStatus(state)).toBe('dg 31k·4f·2s·1↗')
    expect(formatStatus(initialTurnState())).toBe('dg 0·0f·0s·0↗')
  })
})

describe('stats folding', () => {
  const identity = { id: 's1', startedAt: Date.UTC(2026, 0, 2, 3, 4), cwd: '/work/proj' }
  const nudgedTurn: TurnState = {
    ...initialTurnState(),
    firedKinds: ['volume', 'edits'],
    nudged: true,
    followed: true,
    delegations: 2,
    outputChars: 50_000,
  }

  test('folds a turn into a session record', () => {
    const folded = foldTurn(foldTurn(emptySession(identity), nudgedTurn), initialTurnState())
    expect(folded.turns).toBe(2)
    expect(folded.nudgedTurns).toBe(1)
    expect(folded.followedTurns).toBe(1)
    expect(folded.delegations).toBe(2)
    expect(folded.peakOutputChars).toBe(50_000)
    expect(folded.nudgesByKind).toEqual({ volume: 1, 'breadth-files': 0, 'breadth-search': 0, edits: 1 })
  })

  test('a nudged turn that was not followed counts as nudged only', () => {
    const folded = foldTurn(emptySession(identity), { ...nudgedTurn, followed: false })
    expect(folded.nudgedTurns).toBe(1)
    expect(folded.followedTurns).toBe(0)
  })

  test('upsert updates the same session and keeps only the last N', () => {
    const once = upsertSession([], identity, nudgedTurn)
    const twice = upsertSession(once, identity, initialTurnState())
    expect(twice).toHaveLength(1)
    expect(twice[0]?.turns).toBe(2)

    let sessions = twice
    for (let i = 0; i < 60; i++) sessions = upsertSession(sessions, { ...identity, id: `n${i}` }, initialTurnState(), 50)
    expect(sessions).toHaveLength(50)
    expect(sessions[49]?.id).toBe('n59')
    expect(sessions.some(s => s.id === 's1')).toBe(false)
  })

  test('totals compute follow rate and nudges per turn', () => {
    const a = foldTurn(emptySession(identity), nudgedTurn)
    const b = foldTurn(emptySession({ ...identity, id: 's2' }), { ...initialTurnState(), firedKinds: ['volume'], nudged: true })
    const totals = totalsOf([a, b])
    expect(totals.turns).toBe(2)
    expect(totals.nudges).toBe(3)
    expect(totals.followRate).toBe(0.5)
    expect(totals.nudgesPerTurn).toBe(1.5)
    expect(totalsOf([]).followRate).toBeNull()
  })

  test('stats text shows the last n sessions and totals', () => {
    const sessions = ['a', 'b', 'c'].map(id => foldTurn(emptySession({ ...identity, id }), nudgedTurn))
    const text = formatStats(sessions, 2)
    expect(text).toContain('last 2 of 3 sessions')
    expect(text).toContain('nudge-follow rate: 100% (2/2)')
    expect(text).toContain('nudges per turn: 2.00')
    expect(formatStats([], 10)).toContain('no sessions recorded')
  })
})
