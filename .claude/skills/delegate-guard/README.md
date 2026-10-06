# delegate-guard

A Claude Code mod that nudges the main agent to hand work to subagents when it pulls too much material into its own context. It watches the main thread for four signals, and when one trips it appends a short reminder to the tool result the model is already reading. It never blocks a tool call.

## What it does

- Tracks four signals per turn, counting only the main thread (calls made by subagents are ignored):
  - **volume**: more than 40,000 characters of read-only tool output
  - **breadth-files**: 6 or more distinct files read
  - **breadth-search**: 6 or more search calls (`Grep`, `Glob`, and read-only `Bash` using `grep`, `rg`, `ag`, `find`, `fd`, `git grep`, `git ls-files`, or `ls -R`). Chains such as `cd x && rg foo` count; piped `| grep` filters do not
  - **edits**: edits (`Edit`, `Write`, `NotebookEdit`) across 3 or more distinct files
- Mutating tool calls (tests, builds, commits) never count towards output volume or searches, so debug loops stay quiet.
- Each kind fires at most once per turn. A new user prompt resets the turn counters.
- Reminders are appended to the tool result as extra context. Each one suggests a delegation (Explore subagent on haiku for sweeps, a sonnet implementer for well-specified edits) and says to continue inline if you are live-debugging.
- Also reminds when an `Agent`/`Task` call is dispatched with no `model:` and a generic (`general-purpose` or unset) subagent type.
- Draws a status line: `dg <output>·<files>f·<searches>s·<delegations>↗`, for example `dg 12k·3f·2s·1↗` (output is shown in k chars once it reaches 1000).
- Records per-session stats (last 50 sessions) in the plugin store, including whether a nudge was followed by an `Agent` dispatch in the same turn.

## Install

**1. From the marketplace**

```
/plugin install delegate-guard --marketplace srepollock/dotfiles
```

Answer `y` to add the marketplace, then pick a scope (user scope = every session). Hooks-only mods are active immediately.

**2. Via the dotfiles repo**

Clone `srepollock/dotfiles` and run `.dotfile_scripts/claude_sync pull`. It copies `.claude/skills/delegate-guard/` into `~/.claude/skills/`, where a plugin folder auto-loads in every new session.

**3. Ad hoc**

```
claude --plugin-dir /path/to/delegate-guard
```

Or list the absolute path in `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json`.

## Usage

| Command | Effect |
| --- | --- |
| `/delegate-guard` | Show on/off state, this turn's status line, thresholds and usage |
| `/delegate-guard on` | Enable nudges for this session |
| `/delegate-guard off` | Disable nudges for this session and clear the status line |
| `/delegate-guard stats [n]` | Table of the last `n` sessions (default 10) plus totals |

`on`/`off` override the `enabled` option for the current session only. `stats` prints per-session turns, nudges, nudged turns, followed turns, delegations and peak output, then:

```
nudge-follow rate: 50% (3/6)
nudges per turn: 0.40
```

Nudge-follow rate is nudged turns that later dispatched an agent, divided by nudged turns.

## Configuration

Editable in the plugin config menu (`/plugin configure delegate-guard@srepollock-dotfiles`) or under `pluginConfigs.delegate-guard` in settings. The installer may report these options as "not yet set". That's fine: any option left unset uses the default below. Thresholds are read when the plugin loads.

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | Nudge the main agent to delegate |
| `outputCharThreshold` | number | `40000` | Volume nudge fires when read-only output in a turn exceeds this many characters |
| `distinctFileThreshold` | number | `6` | Breadth nudge when this many distinct files are read in a turn |
| `searchCallThreshold` | number | `6` | Search nudge after this many search calls in a turn |
| `editFileThreshold` | number | `3` | Edits nudge when this many distinct files are edited in a turn |

## Pairs with

Its reminders assume a delegation policy with model tiers (haiku for sweeps, sonnet for well-specified implementation, inherit for frontier work), such as the "Delegation & Model Tiers" section of this repo's `.claude/CLAUDE.md`.

## Development

```
claude plugin validate <folder>
claude plugin test <folder>
```

Files are hot-reloaded when the mod is loaded from `~/.claude/skills/` or `--plugin-dir` in an interactive session.

## Requirements

Claude Code with the mod (function-hook plugin) API; built and tested against Claude Code 2.1.291.
