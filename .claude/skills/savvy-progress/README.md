# savvy-progress

A Claude Code mod that shows what your subagents are doing: a one-line progress band above the prompt and a dockable "Agents" panel with per-agent cards. Useful when you fan work out to several subagents and want cost, tokens and status at a glance.

## What it does

- **Band above the prompt** (appears once the first subagent spawns): `Agents ████░░ 2/3 done · 1 running · ≈$1.20 · 84k tok · 4:12`. Green cells are completed, red failed, yellow light-shade running. It yields to the feedback survey.
- **Agents panel** (pane titled "Agents"), opened automatically on the first spawn when visible:
  - tiles for session cost, total tokens and elapsed time
  - **Running** section, then a collapsible **Completed** section (button toggles it; failed agents are counted separately)
  - one card per agent: order and description, a status mark, a weight label (`light`, `medium`, `careful`, `heavy`, or `default`, derived from the agent's effort), model name (for example `Opus 5.5`), effort, subagent type, context percentage, tokens, elapsed time and a context bar
- Agents are tracked from `agent.spawn`, `turn.step` and `turn.complete`. A one-second timer reconciles agents that ended without a completion event (killed, stopped) while any are running.
- Agents it never saw spawn (for example, spawned before a reload) are ignored.
- Visibility is persisted in the plugin store and restored on the next session.

## Install

**1. From the marketplace**

```
/plugin install savvy-progress --marketplace srepollock/dotfiles
```

Answer `y` to add the marketplace, then pick a scope (user scope = every session). Hooks-only mods are active immediately.

**2. Via the dotfiles repo**

Clone `srepollock/dotfiles` and run `.dotfile_scripts/claude_sync pull`. It copies `.claude/skills/savvy-progress/` into `~/.claude/skills/`, where a plugin folder auto-loads in every new session.

**3. Ad hoc**

```
claude --plugin-dir /path/to/savvy-progress
```

Or list the absolute path in `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json`.

## Usage

| Command | Effect |
| --- | --- |
| `/savvy-progress` | Toggle the band and panel |
| `/savvy-progress on` (or `open`) | Show and open the panel |
| `/savvy-progress off` (or `close`) | Hide the band and close the panel |

The command replies `Agents panel on.` or `Agents panel off.`

## Configuration

None. The only persisted setting is the on/off state set by `/savvy-progress`.

## Development

```
claude plugin validate <folder>
claude plugin test <folder>
```

Files are hot-reloaded when the mod is loaded from `~/.claude/skills/` or `--plugin-dir` in an interactive session.

## Requirements

Claude Code with the mod (function-hook plugin) API; built and tested against Claude Code 2.1.291.
