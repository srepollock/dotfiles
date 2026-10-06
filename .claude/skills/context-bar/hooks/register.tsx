import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { allocate, formatReset, formatTokens, glyphFor, rateLabel, summaryText, toSnapshot } from './bar'

const COMMAND = 'context-bar'
const STORE_KEY = 'isVisible'
const TOOL_REFRESH_MS = 2_000
const MIN_BAR_WIDTH = 10

const snapshot = atom({ plugin: 'context-bar', key: 'snapshot' } as const, null)
const isVisible = atom({ plugin: 'context-bar', key: 'isVisible' } as const, true)

async function refresh($: EngineInterface): Promise<void> {
  const usage = await $.session.usage({ breakdown: 'summary' })
  const breakdown = usage.context.breakdown
  if (!breakdown) return

  await update($, snapshot, () => toSnapshot(breakdown, usage.rateLimits))
}

function parseToggle(args: string, current: boolean): boolean {
  const word = args.trim().toLowerCase()
  if (word === 'on') return true
  if (word === 'off') return false
  return !current
}

export const register: Register = on => {
  let lastToolRefresh = 0

  on('session.start', async ($, e, next) => {
    const result = await next(e)

    await $.command.register({
      name: COMMAND,
      description: 'Toggle the context window bar above the prompt',
      argumentHint: '[on|off]',
      immediate: true,
    })

    const stored = await $.store.get(STORE_KEY)
    if (typeof stored === 'boolean') {
      await update($, isVisible, () => stored)
    }
    await refresh($)

    return result
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const shouldShow = parseToggle(e.args, await read($, isVisible))
    await update($, isVisible, () => shouldShow)
    await $.store.set(STORE_KEY, shouldShow)
    if (shouldShow) {
      await refresh($)
    }

    return { text: `Context bar ${shouldShow ? 'on' : 'off'}.` }
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    const now = await $.clock.now()
    if (now - lastToolRefresh >= TOOL_REFRESH_MS) {
      lastToolRefresh = now
      await refresh($)
    }

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, snapshot)
    if (e.props.hasSurvey || current === null || !(await read($, isVisible))) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const summary = summaryText(current)
    const barWidth = Math.max(MIN_BAR_WIDTH, e.props.bodyColumns - summary.length)
    const cells = allocate(current.segments, barWidth)
    const now = await $.clock.now()

    return (
      <Box flexDirection="column">
        <Box key="bar">
          <Text>
            {current.segments.map((segment, i) => (
              <Text color={segment.color}>{glyphFor(segment.kind).repeat(cells[i] ?? 0)}</Text>
            ))}
          </Text>
          <Text dimColor>
            {summary}
          </Text>
        </Box>
        <Box key="legend" flexWrap="wrap" columnGap={2}>
          {current.segments.map(segment => (
            <Text>
              <Text color={segment.color}>{glyphFor(segment.kind)}</Text>
              <Text dimColor>
                {' '}
                {segment.name} {formatTokens(segment.tokens)}
              </Text>
            </Text>
          ))}
        </Box>
        {current.rateLimits.length > 0 && (
          <Box key="usage" flexWrap="wrap" columnGap={2}>
            <Text dimColor>usage</Text>
            {current.rateLimits.map(limit => {
              const reset = formatReset(limit.resetsAt, now)
              return (
                <Text dimColor>
                  {rateLabel(limit.kind)} {Math.round(limit.percentUsed)}%{reset ? ` (${reset})` : ''}
                </Text>
              )
            })}
          </Box>
        )}
      </Box>
    )
  })
}
