import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import {
  addAgent,
  byPhase,
  cellsFor,
  finishAgent,
  formatCost,
  formatDuration,
  formatTokens,
  hasRunning,
  modelName,
  percentOf,
  progressCells,
  recordStep,
  settledPhase,
  totalTokens,
  weightOf,
} from './agents'
import type { AgentRow, SessionTotals } from '../types'

const PLUGIN = 'savvy-progress'
const PANE = 'savvy-progress'
const PANE_TITLE = 'Agents'
const STORE_KEY = 'isVisible'
const TICK_MS = 1_000
const MIN_BAR = 10
const MAX_BAR = 40
const DEFAULT_WINDOW = 200_000

const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, {})
const totals = atom({ plugin: 'savvy-progress', key: 'totals' } as const, null)
const sessionTokens = atom({ plugin: 'savvy-progress', key: 'sessionTokens' } as const, 0)
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)
const isVisible = atom({ plugin: 'savvy-progress', key: 'isVisible' } as const, true)
const isCompletedCollapsed = atom({ plugin: 'savvy-progress', key: 'isCompletedCollapsed' } as const, false)

async function refreshTotals($: EngineInterface): Promise<void> {
  const usage = await $.session.usage()
  const next: SessionTotals = {
    costUsd: usage.cost?.usd ?? null,
    startedAt: usage.startedAt,
    contextWindow: usage.context.window || DEFAULT_WINDOW,
  }
  const at = await $.clock.now()
  await update($, totals, () => next)
  await update($, now, () => at)
}

/** Catches agents that ended without a `turn.complete` of their own (killed, stopped). */
async function reconcile($: EngineInterface): Promise<void> {
  const live = await $.agent.list()
  const at = await $.clock.now()
  await update($, agents, current => {
    let result = current
    for (const info of live) {
      const phase = settledPhase(info.status)
      if (phase) result = finishAgent(result, info.id, phase, at)
    }
    return result
  })
}

function parseToggle(args: string, current: boolean): boolean {
  const word = args.trim().toLowerCase()
  if (word === 'on' || word === 'open') return true
  if (word === 'off' || word === 'close') return false
  return !current
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)

    await $.command.register({
      name: PLUGIN,
      description: 'Toggle the agents progress bar and panel',
      argumentHint: '[on|off]',
      immediate: true,
    })

    const stored = await $.store.get(STORE_KEY)
    if (typeof stored === 'boolean') {
      await update($, isVisible, () => stored)
    }
    await refreshTotals($)

    $.clock.every(TICK_MS, () => {
      void (async () => {
        if (!hasRunning(await read($, agents))) return
        await reconcile($)
        await refreshTotals($)
      })().catch(() => undefined)
    })

    return result
  })

  on('command.run', { command: PLUGIN }, async ($, e) => {
    const shouldShow = parseToggle(e.args, await read($, isVisible))
    await update($, isVisible, () => shouldShow)
    await $.store.set(STORE_KEY, shouldShow)

    if (shouldShow) {
      await refreshTotals($)
      await $.ui.open({ id: PANE, title: PANE_TITLE })
    } else if ((await $.ui.panes()).some(pane => pane.id === PANE)) {
      await $.ui.close({ id: PANE })
    }

    return { text: `Agents panel ${shouldShow ? 'on' : 'off'}.` }
  })

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    if (!result.agentId) return result

    const startedAt = await $.clock.now()
    const isFirst = Object.keys(await read($, agents)).length === 0
    await update($, agents, current =>
      addAgent(current, {
        id: result.agentId!,
        description: e.description || e.subagentType,
        type: e.subagentType,
        model: result.model,
        startedAt,
      }),
    )
    await update($, now, () => startedAt)

    if (isFirst && (await read($, isVisible))) {
      void $.ui.open({ id: PANE, title: PANE_TITLE })
    }

    return result
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const usage = result.usage
    if (usage) {
      await update($, sessionTokens, n => n + totalTokens(usage))
    }
    if (e.agentId) {
      const id = e.agentId
      const effort = typeof e.effort === 'string' ? e.effort : null
      await update($, agents, current => recordStep(current, id, { model: e.model, effort, usage }))
    }

    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const at = await $.clock.now()

    if (e.agentId) {
      const id = e.agentId
      const phase = e.reason === 'answer' ? 'completed' : 'failed'
      await update($, agents, current => finishAgent(current, id, phase, at))
    }
    await refreshTotals($)

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const rows = await read($, agents)
    if (e.props.hasSurvey || Object.keys(rows).length === 0 || !(await read($, isVisible))) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const beneath = await next(e)
    const groups = byPhase(rows)
    const sums = await read($, totals)
    const tokens = await read($, sessionTokens)
    const at = await read($, now)

    const done = groups.completed.length + groups.failed.length
    const total = done + groups.running.length
    const elapsed = sums ? formatDuration(at - sums.startedAt) : ''
    const summary = [
      ` ${done}/${total} done`,
      groups.running.length > 0 ? `${groups.running.length} running` : null,
      formatCost(sums?.costUsd ?? null),
      `${formatTokens(tokens)} tok`,
      elapsed,
    ]
      .filter(Boolean)
      .join(' · ')
    const width = Math.min(MAX_BAR, Math.max(MIN_BAR, e.props.bodyColumns - summary.length - 8))
    const cells = progressCells(
      { completed: groups.completed.length, failed: groups.failed.length, running: groups.running.length },
      width,
    )

    return (
      <Box flexDirection="column">
        {beneath}
        <Box key="savvy-band">
          <Text bold>Agents </Text>
          <Text>
            <Text color="success">{'█'.repeat(cells.completed)}</Text>
            <Text color="error">{'█'.repeat(cells.failed)}</Text>
            <Text color="warning">{'░'.repeat(cells.running)}</Text>
          </Text>
          <Text dimColor>{summary}</Text>
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const rows = await read($, agents)
    const groups = byPhase(rows)
    const sums = await read($, totals)
    const tokens = await read($, sessionTokens)
    const at = await read($, now)
    const isCollapsed = await read($, isCompletedCollapsed)
    const window = sums?.contextWindow ?? DEFAULT_WINDOW
    const barWidth = Math.max(MIN_BAR, Math.min(MAX_BAR, e.props.bodyColumns - 4))
    const finished = [...groups.completed, ...groups.failed].sort((a, b) => a.order - b.order)

    const tile = (key: string, label: string, value: string) => (
      <Box key={key} flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1} flexGrow={1}>
        <Text dimColor>{label}</Text>
        <Text bold>{value}</Text>
      </Box>
    )

    const card = (row: AgentRow) => {
      const weight = weightOf(row.effort)
      const percent = percentOf(row.contextTokens, window)
      const filled = cellsFor(percent, barWidth)
      const elapsed = formatDuration((row.endedAt ?? at) - row.startedAt)
      const mark =
        row.phase === 'running' ? <Text color="error">●</Text>
        : row.phase === 'completed' ? <Text color="success">✓</Text>
        : <Text color="error">✗</Text>

      return (
        <Box key={`agent-${row.id}`} flexDirection="column" marginTop={1}>
          <Box justifyContent="space-between">
            <Text bold wrap="truncate-end">
              {row.order}. {row.description}
            </Text>
            {mark}
          </Box>
          <Text>
            <Text color={weight.color}>{weight.label}</Text>
            <Text dimColor>
              {' '}
              {modelName(row.model)}
              {row.effort ? ` · ${row.effort}` : ''} · {row.type}
            </Text>
          </Text>
          <Text dimColor>
            ctx {percent}% · {formatTokens(row.tokens)} · {elapsed}
          </Text>
          <Text>
            <Text color={weight.color}>{'━'.repeat(filled)}</Text>
            <Text color="subtle">{'━'.repeat(barWidth - filled)}</Text>
          </Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box key="tiles" columnGap={1}>
          {tile('cost', 'Cost', formatCost(sums?.costUsd ?? null))}
          {tile('tokens', 'Tokens', formatTokens(tokens))}
          {tile('time', 'Time', sums ? formatDuration(at - sums.startedAt) : '—')}
        </Box>

        {Object.keys(rows).length === 0 && (
          <Text key="empty" dimColor>
            No subagents yet.
          </Text>
        )}

        {groups.running.length > 0 && (
          <Box key="running" flexDirection="column" marginTop={1}>
            <Text dimColor>Running · {groups.running.length}</Text>
            {groups.running.map(card)}
          </Box>
        )}

        {finished.length > 0 && (
          <Box key="finished" flexDirection="column" marginTop={1}>
            <Box columnGap={1}>
              <Button
                key="toggle-finished"
                label={isCollapsed ? '▸' : '▾'}
                onPress={() => update($, isCompletedCollapsed, value => !value)}
              />
              <Text dimColor>
                Completed · {groups.completed.length}
                {groups.failed.length > 0 ? ` · failed ${groups.failed.length}` : ''}
              </Text>
            </Box>
            {!isCollapsed && finished.map(card)}
          </Box>
        )}
      </Box>
    )
  })
}
