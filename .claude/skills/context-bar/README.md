# context-bar

A Claude Code mod that draws the context window as a stacked bar above the prompt, with one colour per `/context` category, so you can see what is filling the window without running `/context`.

## What it does

- Draws a bar above the prompt, sized to the terminal width, with a summary such as ` 40k/200k 20%` (used tokens, window size, percentage).
- Each `/context` category gets a share of the bar proportional to its tokens, in the category's own colour, and at least one cell so small categories stay visible. Glyphs distinguish used (`█`), free (`░`) and buffer (`▒`) space.
- Draws a legend under the bar listing each category with its token count, for example `█ Messages 25k`. Deferred and zero-token categories are omitted.
- Draws a dimmed `usage` row under the legend with your plan's rate limits: percent used and time until reset for each window the session reports, for example `usage  5h 42% (2h15m)  7d 18% (4d6h)`. A spend limit shows as `$`. The row is hidden when the session reports no rate limits.
- Refreshes after each turn, after compaction, on session start, when toggled on, and at most every 2 seconds on tool calls.
- Yields to the feedback survey.
- Visibility is persisted in the plugin store and restored on the next session.

## Install

**1. From the marketplace**

```
/plugin install context-bar --marketplace srepollock/dotfiles
```

Answer `y` to add the marketplace, then pick a scope (user scope = every session). Hooks-only mods are active immediately.

**2. Via the dotfiles repo**

Clone `srepollock/dotfiles` and run `.dotfile_scripts/claude_sync pull`. It copies `.claude/skills/context-bar/` into `~/.claude/skills/`, where a plugin folder auto-loads in every new session.

**3. Ad hoc**

```
claude --plugin-dir /path/to/context-bar
```

Or list the absolute path in `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json`.

## Usage

| Command | Effect |
| --- | --- |
| `/context-bar` | Toggle the bar |
| `/context-bar on` | Show the bar |
| `/context-bar off` | Hide the bar |

The command replies `Context bar on.` or `Context bar off.`

## Configuration

None. The only persisted setting is the on/off state set by `/context-bar`.

## Development

```
claude plugin validate <folder>
claude plugin test <folder>
```

Files are hot-reloaded when the mod is loaded from `~/.claude/skills/` or `--plugin-dir` in an interactive session.

## Requirements

Claude Code with the mod (function-hook plugin) API; built and tested against Claude Code 2.1.291.
