import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ContextCategory, On, RenderPropsOf, SessionUsage } from 'claude-code'

import { allocate, formatTokens, toSnapshot } from './bar'
import type { Segment } from '../types'

const SURFACES = ['terminal', 'desktop'] as const

const CATEGORIES: ContextCategory[] = [
  { name: 'System prompt', tokens: 3_000, color: 'promptBorder', isDeferred: false, kind: 'used' },
  { name: 'System tools', tokens: 12_000, color: 'inactive', isDeferred: false, kind: 'used' },
  { name: 'MCP tools', tokens: 40_000, color: 'cyan_FOR_SUBAGENTS_ONLY', isDeferred: true, kind: 'deferred' },
  { name: 'Messages', tokens: 25_000, color: 'permission', isDeferred: false, kind: 'used' },
  { name: 'Free space', tokens: 127_000, color: 'promptBorder', isDeferred: false, kind: 'free' },
  { name: 'Autocompact buffer', tokens: 33_000, color: 'inactive', isDeferred: false, kind: 'buffer' },
]

function usage(): SessionUsage {
  return {
    startedAt: 0,
    rateLimits: [],
    context: {
      tokens: 40_000,
      window: 200_000,
      percent: 20,
      breakdown: {
        categories: CATEGORIES,
        totalTokens: 40_000,
        maxTokens: 200_000,
        rawMaxTokens: 200_000,
        autocompactSource: 'model-default',
        percentage: 20,
        gridRows: [],
        model: 'claude-opus-5-5',
        memoryFiles: [],
        mcpTools: [],
        agents: [],
        isAutoCompactEnabled: true,
        apiUsage: null,
      },
    },
  }
}

function engineBeneath(on: On, store: Record<string, unknown> = {}): Record<string, unknown> {
  on('store.get', ($, e) => ({ value: store[e.key] }))
  on('store.set', ($, e) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  on('session.usage', () => ({ value: usage() }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })

  return store
}

function bandProps(hasSurvey = false): RenderPropsOf['AbovePrompt'] {
  return {
    hasSurvey,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  }
}

function runCommand($: Engine, args: string) {
  return $.command.run({
    command: 'context-bar',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
}

async function start($: Engine): Promise<void> {
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
}

function band($: Engine, surface: (typeof SURFACES)[number], hasSurvey = false) {
  return $.ui.mount({ plugin: 'context-bar', surface, component: 'AbovePrompt', props: bandProps(hasSurvey) })
}

describe('allocate', () => {
  const seg = (tokens: number): Segment => ({ name: 'x', color: 'c', tokens, kind: 'used' })

  test('cells sum exactly to the width', () => {
    for (const width of [10, 37, 64, 80, 133]) {
      const cells = allocate([seg(3_000), seg(12_000), seg(25_000), seg(127_000), seg(33_000)], width)
      expect(cells.reduce((a, b) => a + b, 0)).toBe(width)
    }
  })

  test('a tiny category still gets one cell', () => {
    const cells = allocate([seg(100), seg(199_900)], 40)
    expect(cells[0]).toBe(1)
    expect(cells[1]).toBe(39)
  })

  test('a breakdown past the window still fills the bar', () => {
    const cells = allocate([seg(150_000), seg(90_000)], 50)
    expect(cells.reduce((a, b) => a + b, 0)).toBe(50)
  })
})

describe('toSnapshot', () => {
  test('drops deferred rows and measures against rawMaxTokens', () => {
    const snapshot = toSnapshot(usage().context.breakdown!)
    expect(snapshot.segments.map(s => s.name)).toEqual([
      'System prompt',
      'System tools',
      'Messages',
      'Free space',
      'Autocompact buffer',
    ])
    expect(snapshot.maxTokens).toBe(200_000)
  })
})

test('formatTokens', () => {
  expect(formatTokens(950)).toBe('950')
  expect(formatTokens(45_230)).toBe('45.2k')
  expect(formatTokens(200_000)).toBe('200k')
  expect(formatTokens(1_000_000)).toBe('1M')
})

for (const surface of SURFACES) {
  describe(`band on ${surface}`, () => {
    test('draws the bar and legend after session start', async ($, on) => {
      engineBeneath(on)
      await start($)

      const ui = await band($, surface)
      const bar = await ui.find({ key: 'bar' })
      expect(bar?.text).toContain('█')
      expect(bar?.text).toContain('░')
      expect(bar?.text).toContain('40k/200k 20%')

      const legend = await ui.find({ key: 'legend' })
      expect(legend?.text).toContain('Messages 25k')
      expect(legend?.text).not.toContain('MCP tools')
    })

    test('yields to a survey', async ($, on) => {
      engineBeneath(on)
      await start($)

      const ui = await band($, surface, true)
      expect(await ui.find({ key: 'bar' })).toBeUndefined()
    })

    test('/context-bar toggles it off and on, and remembers', async ($, on) => {
      const store = engineBeneath(on)
      await start($)

      const off = await runCommand($, '')
      expect(off.text).toBe('Context bar off.')
      expect(await (await band($, surface)).find({ key: 'bar' })).toBeUndefined()
      expect(store.isVisible).toBe(false)

      const onAgain = await runCommand($, 'on')
      expect(onAgain.text).toBe('Context bar on.')
      expect(await (await band($, surface)).find({ key: 'bar' })).toBeDefined()
    })

    test('stays hidden in a new session when last turned off', async ($, on) => {
      engineBeneath(on, { isVisible: false })
      await start($)

      expect(await (await band($, surface)).find({ key: 'bar' })).toBeUndefined()
    })
  })
}
