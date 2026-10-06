import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

type Answer = { text: string; isReadOnly?: true }

type Beneath = {
  store: Record<string, unknown>
  statuses: (string | undefined)[]
  clock: ReturnType<typeof mock.clock>
}

const NOW = Date.UTC(2026, 0, 2, 3, 4)

function engineBeneath(on: On, answers: (tool: string, e: Record<string, unknown>) => Answer = () => ({ text: 'ok' })): Beneath {
  const beneath: Beneath = { store: {}, statuses: [], clock: mock.clock(on, { now: NOW }) }
  on('store.get', ($, e) => ({ value: beneath.store[e.key] }))
  on('store.set', ($, e) => {
    beneath.store[e.key] = e.value
    return { value: undefined }
  })
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('ui.status', ($, e) => {
    beneath.statuses.push(e.text)
    return { value: undefined }
  })
  on('tool.call', ($, e) => {
    const answer = answers(e.tool, e as Record<string, unknown>)
    return { result: answer.text, text: answer.text, ...(answer.isReadOnly ? { isReadOnly: true as const } : {}) }
  })
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('turn.complete', () => ({ text: '' }))
  return beneath
}

const readOnly = (chars: number): Answer => ({ text: 'x'.repeat(chars), isReadOnly: true })

async function start($: Engine): Promise<void> {
  await $.session.start({ cwd: '/work/proj', surface: 'terminal', isInteractive: true })
}

type ToolArgs = Parameters<Engine['tool']['call']>[0]

// Grep and Glob are not built-in tools in every build, so their inputs are not in the typed union.
function callLoose($: Engine, tool: string, input: Record<string, unknown>) {
  return $.tool.call({ tool, ...input } as unknown as ToolArgs)
}

async function readFile($: Engine, path: string) {
  return $.tool.call({ tool: 'Read', file_path: path })
}

async function completeTurn($: Engine, agentId?: string) {
  return $.turn.complete({ answer: 'done', durationMs: 10, isAborted: false, turnId: 't1', reason: 'answer', ...(agentId ? { agentId } : {}) })
}

function submit($: Engine, text = 'go', kind: 'composer' | 'task-notification' = 'composer') {
  return $.prompt.submit({ text, wait: false, origin: { kind } })
}

function runCommand($: Engine, args: string) {
  return $.command.run({
    command: 'delegate-guard',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 100 },
  })
}

function contextOf(result: { context?: readonly string[] }): readonly string[] {
  return result.context ?? []
}

describe('tool.call nudges', () => {
  test('below every threshold adds no context', async ($, on) => {
    engineBeneath(on)
    await start($)
    for (const path of ['/a', '/b', '/c']) {
      expect(contextOf(await readFile($, path))).toHaveLength(0)
    }
  })

  test('six distinct reads fire breadth-files once; the seventh does not re-fire', async ($, on) => {
    engineBeneath(on)
    await start($)
    const contexts: (readonly string[])[] = []
    for (const path of ['/1', '/2', '/3', '/4', '/5', '/6', '/7']) contexts.push(contextOf(await readFile($, path)))
    expect(contexts.slice(0, 5).flat()).toHaveLength(0)
    expect(contexts[5]).toHaveLength(1)
    expect(contexts[5]?.[0]).toContain('6 distinct files read directly')
    expect(contexts[6]).toHaveLength(0)
  })

  test('the same file read six times does not fire', async ($, on) => {
    engineBeneath(on)
    await start($)
    for (let i = 0; i < 6; i++) expect(contextOf(await readFile($, '/same'))).toHaveLength(0)
  })

  test('six Grep and Glob calls fire breadth-search', async ($, on) => {
    engineBeneath(on)
    await start($)
    const contexts: (readonly string[])[] = []
    for (let i = 0; i < 6; i++) {
      const tool = i % 2 === 0 ? 'Grep' : 'Glob'
      contexts.push(contextOf(await callLoose($, tool, { pattern: 'x' })))
    }
    expect(contexts.slice(0, 5).flat()).toHaveLength(0)
    expect(contexts[5]?.[0]).toContain('6 search calls')
  })

  test('read-only Bash search commands count as searches', async ($, on) => {
    engineBeneath(on, () => readOnly(10))
    await start($)
    const contexts: (readonly string[])[] = []
    for (let i = 0; i < 6; i++) contexts.push(contextOf(await $.tool.call({ tool: 'Bash', command: `rg term${i} src` })))
    expect(contexts.slice(0, 5).flat()).toHaveLength(0)
    expect(contexts[5]?.[0]).toContain('6 search calls')
  })

  test('one 45k-char read-only result fires volume', async ($, on) => {
    engineBeneath(on, () => readOnly(45_000))
    await start($)
    const result = await $.tool.call({ tool: 'Bash', command: 'cat big.log' })
    expect(contextOf(result)).toHaveLength(1)
    expect(contextOf(result)[0]).toContain('~45k chars of tool output')
  })

  test('a debug loop of mutating Bash plus two edits to one file never fires', async ($, on) => {
    engineBeneath(on, () => ({ text: 'FAIL 1 test' }))
    await start($)
    for (let i = 0; i < 10; i++) {
      expect(contextOf(await $.tool.call({ tool: 'Bash', command: 'yarn test' }))).toHaveLength(0)
    }
    for (let i = 0; i < 2; i++) {
      const edit = await $.tool.call({ tool: 'Edit', file_path: '/a.ts', old_string: 'a', new_string: 'b' })
      expect(contextOf(edit)).toHaveLength(0)
    }
  })

  test('the third distinct edited file fires edits', async ($, on) => {
    engineBeneath(on)
    await start($)
    const contexts: (readonly string[])[] = []
    for (const path of ['/a', '/b', '/c']) {
      contexts.push(contextOf(await $.tool.call({ tool: 'Write', file_path: path, content: 'x' })))
    }
    expect(contexts[1]).toHaveLength(0)
    expect(contexts[2]?.[0]).toContain('edits now span 3 files')
  })

  test('a prompt from the user resets the turn; a notification does not', async ($, on) => {
    engineBeneath(on)
    await start($)
    for (const path of ['/1', '/2', '/3', '/4', '/5']) await readFile($, path)
    await submit($, 'again', 'task-notification')
    expect(contextOf(await readFile($, '/6'))).toHaveLength(1)

    await submit($)
    for (const path of ['/1', '/2', '/3', '/4', '/5']) expect(contextOf(await readFile($, path))).toHaveLength(0)
    expect(contextOf(await readFile($, '/6'))).toHaveLength(1)
  })

  test('the status line tracks counted calls', async ($, on) => {
    const beneath = engineBeneath(on, (tool) => (tool === 'Read' ? readOnly(31_000) : { text: 'ok' }))
    await start($)
    await readFile($, '/a')
    await callLoose($, 'Grep', { pattern: 'x' })
    expect(beneath.statuses.at(-1)).toBe('dg 31k·1f·1s·0↗')
  })

  test('answers pass through unchanged when nothing fires', async ($, on) => {
    engineBeneath(on, () => ({ text: 'hello' }))
    await start($)
    const result = await readFile($, '/a')
    expect(result.text).toBe('hello')
    expect(result.context).toBeUndefined()
  })
})

describe('agent loops and enablement', () => {
  test('calls carrying an agentId are ignored', async ($, on) => {
    engineBeneath(on)
    await start($)
    for (const path of ['/1', '/2', '/3', '/4', '/5', '/6']) {
      const result = await $.tool.call({ tool: 'Read', file_path: path, agentId: 'agent-1' } as ToolArgs)
      expect(contextOf(result)).toHaveLength(0)
    }
  })

  test('enabled: false is inert', { options: { enabled: false } }, async ($, on) => {
    const beneath = engineBeneath(on)
    await start($)
    for (const path of ['/1', '/2', '/3', '/4', '/5', '/6', '/7']) {
      expect(contextOf(await readFile($, path))).toHaveLength(0)
    }
    await completeTurn($)
    expect(beneath.store.sessions).toBeUndefined()
    expect(beneath.statuses).toHaveLength(0)
  })

  test('/delegate-guard off silences nudges and clears the status; on restores them', async ($, on) => {
    const beneath = engineBeneath(on)
    await start($)
    await readFile($, '/1')
    expect((await runCommand($, 'off')).text).toContain('off')
    expect(beneath.statuses.at(-1)).toBeUndefined()
    for (const path of ['/2', '/3', '/4', '/5', '/6', '/7']) expect(contextOf(await readFile($, path))).toHaveLength(0)

    await runCommand($, 'on')
    await submit($)
    for (const path of ['/1', '/2', '/3', '/4', '/5']) await readFile($, path)
    expect(contextOf(await readFile($, '/6'))).toHaveLength(1)
  })

  test('thresholds come from options', { options: { distinctFileThreshold: 2 } }, async ($, on) => {
    engineBeneath(on)
    await start($)
    await readFile($, '/1')
    expect(contextOf(await readFile($, '/2'))[0]).toContain('2 distinct files')
  })
})

describe('delegation reminders', () => {
  test('Agent with no model and general-purpose type gets the tier reminder', async ($, on) => {
    engineBeneath(on)
    await start($)
    const bare = await $.tool.call({ tool: 'Agent', description: 'd', prompt: 'p' })
    expect(contextOf(bare)[0]).toContain('without `model:`')
    const general = await $.tool.call({ tool: 'Agent', description: 'd', prompt: 'p', subagent_type: 'general-purpose' })
    expect(contextOf(general)[0]).toContain('without `model:`')
  })

  test('Agent with a model set gets no reminder', async ($, on) => {
    engineBeneath(on)
    await start($)
    const result = await $.tool.call({ tool: 'Agent', description: 'd', prompt: 'p', model: 'haiku' })
    expect(contextOf(result)).toHaveLength(0)
  })
})

describe('stats', () => {
  test('an Agent after a nudge is recorded as followed', async ($, on) => {
    const beneath = engineBeneath(on)
    await start($)
    for (const path of ['/1', '/2', '/3', '/4', '/5', '/6']) await readFile($, path)
    await $.tool.call({ tool: 'Agent', description: 'd', prompt: 'p', model: 'haiku' })
    await completeTurn($)

    const sessions = beneath.store.sessions as Record<string, unknown>[]
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject({ turns: 1, nudgedTurns: 1, followedTurns: 1, delegations: 1, cwd: '/work/proj' })
    expect(sessions[0]?.nudgesByKind).toMatchObject({ 'breadth-files': 1 })

    const stats = (await runCommand($, 'stats')).text ?? ''
    expect(stats).toContain('nudge-follow rate: 100% (1/1)')
    expect(stats).toContain('nudges per turn: 1.00')
  })

  test('a nudge that is not followed lowers the follow rate; turns accumulate in one session', async ($, on) => {
    const beneath = engineBeneath(on)
    await start($)
    for (const path of ['/1', '/2', '/3', '/4', '/5', '/6']) await readFile($, path)
    await completeTurn($)
    await submit($)
    await readFile($, '/1')
    await completeTurn($)

    const sessions = beneath.store.sessions as Record<string, unknown>[]
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject({ turns: 2, nudgedTurns: 1, followedTurns: 0 })
    expect(((await runCommand($, 'stats 5')).text ?? '')).toContain('nudge-follow rate: 0% (0/1)')
  })

  test('turn.complete from a subagent loop is not counted', async ($, on) => {
    const beneath = engineBeneath(on)
    await start($)
    await completeTurn($, 'agent-1')
    expect(beneath.store.sessions).toBeUndefined()
  })

  test('each session start begins a new record and only the last 50 are kept', async ($, on) => {
    const beneath = engineBeneath(on)
    for (let i = 0; i < 52; i++) {
      await start($)
      await completeTurn($)
      await beneath.clock.advance(1_000)
    }
    expect(beneath.store.sessions).toHaveLength(50)
  })

  test('stats with no history, and no-arg status with usage', async ($, on) => {
    engineBeneath(on)
    await start($)
    expect((await runCommand($, 'stats')).text).toContain('no sessions recorded')
    const status = (await runCommand($, '')).text ?? ''
    expect(status).toContain('delegate-guard: on')
    expect(status).toContain('/delegate-guard stats [n]')
  })
})
