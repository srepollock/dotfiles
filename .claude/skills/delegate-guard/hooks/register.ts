import { atom, read, update } from 'claude-code'
import type { EngineInterface, PluginOptions, Register } from 'claude-code'

import {
  MAX_SESSIONS,
  formatStats,
  formatStatus,
  initialTurnState,
  isMainLoop,
  observe,
  upsertSession,
} from './guard'
import type { GuardCall, Thresholds } from './guard'
import type { SessionRecord } from '../types'

const COMMAND = 'delegate-guard'
const SESSIONS_KEY = 'sessions'
const DEFAULT_STATS_COUNT = 10

const turn = atom({ plugin: 'delegate-guard', key: 'turn' } as const, initialTurnState())
const isEnabled = atom({ plugin: 'delegate-guard', key: 'isEnabled' } as const, null)
const session = atom({ plugin: 'delegate-guard', key: 'session' } as const, null)

const USAGE = [
  'usage:',
  '  /delegate-guard on           enable nudges for this session',
  '  /delegate-guard off          disable nudges for this session',
  '  /delegate-guard stats [n]    last n sessions (default 10) and totals',
].join('\n')

function numberOption(options: PluginOptions, key: string, fallback: number): number {
  const value = options[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function thresholdsFrom(options: PluginOptions): Thresholds {
  return {
    outputChars: numberOption(options, 'outputCharThreshold', 40_000),
    distinctFiles: numberOption(options, 'distinctFileThreshold', 6),
    searchCalls: numberOption(options, 'searchCallThreshold', 6),
    editFiles: numberOption(options, 'editFileThreshold', 3),
  }
}

async function isActive($: EngineInterface, options: PluginOptions): Promise<boolean> {
  const runtime = await read($, isEnabled)
  return runtime ?? options.enabled !== false
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function toCall(e: Readonly<Record<string, unknown>>, answer: { text?: string; isReadOnly?: true }): GuardCall {
  const tool = String(e.tool)
  return {
    tool,
    filePath: text(e.file_path) ?? text(e.notebook_path),
    command: text(e.command),
    model: text(e.model),
    subagentType: text(e.subagent_type),
    isReadOnly: answer.isReadOnly === true,
    outputChars: answer.text?.length ?? 0,
  }
}

async function readSessions($: EngineInterface): Promise<SessionRecord[]> {
  const stored = await $.store.get(SESSIONS_KEY)
  return Array.isArray(stored) ? (stored as SessionRecord[]) : []
}

async function statsText($: EngineInterface, args: readonly string[]): Promise<string> {
  const requested = Number.parseInt(args[1] ?? '', 10)
  const count = Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_STATS_COUNT
  return formatStats(await readSessions($), count)
}

export const register: Register = (on, options) => {
  const thresholds = thresholdsFrom(options)

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({
      name: COMMAND,
      description: 'Delegation nudges: toggle for this session or show nudge stats',
      argumentHint: '[on|off|stats [n]]',
    })
    const at = await $.clock.now()
    await update($, session, () => ({ id: String(at), startedAt: at, cwd: e.cwd }))
    await update($, turn, () => initialTurnState())
    return result
  })

  on('prompt.submit', async ($, e, next) => {
    const result = await next(e)
    const isUserPrompt = e.origin.kind === 'composer' || e.origin.kind === 'bridge' || e.origin.kind === 'sdk'
    if (result.drop === undefined && isUserPrompt) {
      await update($, turn, () => initialTurnState())
    }
    return result
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    if (!isMainLoop(e) || !(await isActive($, options))) return next(e)

    const answer = await next(e)
    if (answer.deny !== undefined) return answer

    const call = toCall(e, answer)
    let reminders: string[] = []
    let status = ''
    await update($, turn, current => {
      const observed = observe(current, call, thresholds)
      reminders = observed.reminders
      status = formatStatus(observed.state)
      return observed.state
    })
    if (status !== formatStatus(initialTurnState()) || reminders.length > 0) $.ui.status(status)

    if (reminders.length === 0) return answer
    return { ...answer, context: [...(answer.context ?? []), ...reminders] }
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (!isMainLoop(e) || !(await isActive($, options))) return result

    const finished = await read($, turn)
    const identity = (await read($, session)) ?? {
      id: String(await $.clock.now()),
      startedAt: await $.clock.now(),
      cwd: null,
    }
    await update($, session, () => identity)
    const sessions = await readSessions($)
    await $.store.set(SESSIONS_KEY, upsertSession(sessions, identity, finished, MAX_SESSIONS))
    await update($, turn, () => initialTurnState())
    return result
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const args = e.args.trim().split(/\s+/).filter(Boolean)
    const verb = args[0]

    if (verb === 'on') {
      await update($, isEnabled, () => true)
      return { text: 'delegate-guard: on for this session.' }
    }
    if (verb === 'off') {
      await update($, isEnabled, () => false)
      $.ui.status(undefined)
      return { text: 'delegate-guard: off for this session.' }
    }
    if (verb === 'stats') {
      return { text: await statsText($, args) }
    }

    const active = await isActive($, options)
    const current = await read($, turn)
    const lines = [
      `delegate-guard: ${active ? 'on' : 'off'}`,
      `this turn: ${formatStatus(current)}`,
      `thresholds: ${thresholds.outputChars} chars, ${thresholds.distinctFiles} files, ${thresholds.searchCalls} searches, ${thresholds.editFiles} edited files`,
      '',
      USAGE,
    ]
    return { text: lines.join('\n') }
  })
}
