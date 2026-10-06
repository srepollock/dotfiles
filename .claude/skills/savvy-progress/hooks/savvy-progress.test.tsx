import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { AgentSpawnInput, On, RenderPropsOf, SessionUsage } from 'claude-code'

import {
  addAgent,
  byPhase,
  finishAgent,
  formatDuration,
  formatTokens,
  modelName,
  progressCells,
  recordStep,
  settledPhase,
  weightOf,
} from './agents'
import type { Agents } from './agents'

const SURFACES = ['terminal', 'desktop'] as const

const USAGE = {
  input_tokens: 2_000,
  output_tokens: 1_000,
  cache_read_input_tokens: 30_000,
  cache_creation_input_tokens: 4_000,
}

function sessionUsage(): SessionUsage {
  return {
    startedAt: SESSION_START,
    rateLimits: [],
    context: { tokens: 10_000, window: 200_000, percent: 5 },
    cost: { usd: 14.4 },
  }
}

const SESSION_START = 1_000_000

function spawnInput(description: string): AgentSpawnInput {
  return {
    tool_use_id: `toolu_${description}`,
    prompt: description,
    description,
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: false,
    fork: false,
  }
}

function engineBeneath(on: On, store: Record<string, unknown> = {}): Record<string, unknown> {
  let nextId = 0
  const panes = new Set<string>()
  mock.clock(on, { now: SESSION_START + 60_000 })
  on('ui.open', ($, e) => {
    panes.add(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', ($, e) => {
    panes.delete(e.id)
    return { value: undefined }
  })
  on('ui.panes', () => ({ value: [...panes].map(id => ({ id, title: id, isShown: true, isFocused: false, isPlaced: true })) }))
  on('store.get', ($, e) => ({ value: store[e.key] }))
  on('store.set', ($, e) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  on('session.usage', () => ({ value: sessionUsage() }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('agent.list', () => ({ value: [] }))
  on('agent.spawn', () => ({ model: 'claude-opus-5-5', agentId: `agent-${++nextId}` }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })

  return store
}

function bandProps(hasSurvey = false): RenderPropsOf['AbovePrompt'] {
  return {
    hasSurvey,
    isWorking: true,
    maxRows: 20,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  }
}

async function start($: Engine): Promise<void> {
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
}

function band($: Engine, surface: (typeof SURFACES)[number], hasSurvey = false) {
  return $.ui.mount({ plugin: 'savvy-progress', surface, component: 'AbovePrompt', props: bandProps(hasSurvey) })
}

function runCommand($: Engine, args: string) {
  return $.command.run({
    command: 'savvy-progress',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 100 },
  })
}

describe('agent bookkeeping', () => {
  const spawned = (id: string) => ({ id, description: `task ${id}`, type: 'Explore', model: 'claude-opus-5-5', startedAt: 0 })

  test('a spawned agent runs, accrues step usage, and finishes once', () => {
    let agents: Agents = addAgent({}, spawned('a'))
    agents = recordStep(agents, 'a', { model: 'claude-opus-5-5', effort: 'xhigh', usage: USAGE })
    agents = recordStep(agents, 'a', { model: 'claude-opus-5-5', effort: null, usage: USAGE })

    expect(agents.a?.tokens).toBe(74_000)
    expect(agents.a?.contextTokens).toBe(36_000)
    expect(agents.a?.effort).toBe('xhigh')

    agents = finishAgent(agents, 'a', 'completed', 5_000)
    agents = finishAgent(agents, 'a', 'failed', 9_000)
    expect(agents.a?.phase).toBe('completed')
    expect(agents.a?.endedAt).toBe(5_000)
  })

  test('steps from an unknown agent are ignored', () => {
    const agents = recordStep({}, 'ghost', { model: 'x', effort: null, usage: USAGE })
    expect(agents).toEqual({})
  })

  test('groups by phase in spawn order', () => {
    let agents: Agents = {}
    for (const id of ['a', 'b', 'c']) agents = addAgent(agents, spawned(id))
    agents = finishAgent(agents, 'b', 'completed', 1)
    agents = finishAgent(agents, 'c', 'failed', 1)

    const groups = byPhase(agents)
    expect(groups.running.map(r => r.id)).toEqual(['a'])
    expect(groups.completed.map(r => r.id)).toEqual(['b'])
    expect(groups.failed.map(r => r.id)).toEqual(['c'])
  })

  test('engine statuses map to settled phases', () => {
    expect(settledPhase('running')).toBeUndefined()
    expect(settledPhase('waiting')).toBeUndefined()
    expect(settledPhase('completed')).toBe('completed')
    expect(settledPhase('killed')).toBe('failed')
  })
})

describe('formatting', () => {
  test('model names', () => {
    expect(modelName('claude-opus-5-5')).toBe('Opus 5.5')
    expect(modelName('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
    expect(modelName('claude-fable-5-1[1m]')).toBe('Fable 5.1')
  })

  test('effort weights', () => {
    expect(weightOf('xhigh').label).toBe('heavy')
    expect(weightOf('high').label).toBe('careful')
    expect(weightOf('medium').label).toBe('medium')
    expect(weightOf('low').label).toBe('light')
    expect(weightOf(null).label).toBe('default')
  })

  test('tokens and durations', () => {
    expect(formatTokens(177_000)).toBe('177k')
    expect(formatTokens(39_000_000)).toBe('39.0M')
    expect(formatDuration(201_000)).toBe('3:21')
    expect(formatDuration(3_725_000)).toBe('1:02:05')
  })

  test('progress cells always fill the width', () => {
    for (const width of [10, 23, 40]) {
      const cells = progressCells({ completed: 2, failed: 1, running: 4 }, width)
      expect(cells.completed + cells.failed + cells.running).toBe(width)
    }
    expect(progressCells({ completed: 3, failed: 0, running: 0 }, 12)).toEqual({ completed: 12, failed: 0, running: 0 })
  })
})

for (const surface of SURFACES) {
  describe(`band on ${surface}`, () => {
    test('passes through until a subagent spawns', async ($, on) => {
      engineBeneath(on)
      await start($)

      const ui = await band($, surface)
      expect(await ui.find({ key: 'savvy-band' })).toBeUndefined()
      expect(await ui.find({ key: 'engine' })).toBeDefined()
    })

    test('shows progress and totals once agents run, keeping what is beneath', async ($, on) => {
      engineBeneath(on)
      await start($)
      await $.agent.spawn(spawnInput('Survey repo'))
      await $.agent.spawn(spawnInput('Survey docs'))

      const ui = await band($, surface)
      const row = await ui.find({ key: 'savvy-band' })
      expect(row?.text).toContain('0/2 done')
      expect(row?.text).toContain('2 running')
      expect(row?.text).toContain('≈$14.4')
      expect(row?.text).toContain('░')
      expect(await ui.find({ key: 'engine' })).toBeDefined()
    })

    test('yields to a survey', async ($, on) => {
      engineBeneath(on)
      await start($)
      await $.agent.spawn(spawnInput('d'))

      expect(await (await band($, surface, true)).find({ key: 'savvy-band' })).toBeUndefined()
    })

    test('/savvy-progress off hides it and remembers', async ($, on) => {
      const store = engineBeneath(on)
      await start($)
      await $.agent.spawn(spawnInput('d'))

      const off = await runCommand($, 'off')
      expect(off.text).toBe('Agents panel off.')
      expect(store.isVisible).toBe(false)
      expect(await (await band($, surface)).find({ key: 'savvy-band' })).toBeUndefined()
    })
  })

  describe(`pane on ${surface}`, () => {
    test('lists running agents under the tiles', async ($, on) => {
      engineBeneath(on)
      await start($)
      await $.agent.spawn(spawnInput('Cache clock handover'))

      const ui = await $.ui.mount({
        plugin: 'savvy-progress',
        surface,
        component: 'Pane',
        requestId: 'savvy-progress',
        props: {
          title: 'Agents',
          isFocused: false,
          bodyColumns: 60,
          placement: 'dock',
          scroll: { offset: 0, bodyRows: 40 },
          view: {},
        },
      })
      expect((await ui.find({ key: 'tiles' }))?.text).toContain('≈$14.4')
      const running = await ui.find({ key: 'running' })
      expect(running?.text).toContain('Running · 1')
      expect(running?.text).toContain('1. Cache clock handover')
      expect(running?.text).toContain('Opus 5.5')
    })
  })
}
