# dotfiles

```
                                                                                                                              
   (((/                                                   /(((          
   %%%%(((                                             (((&%%%          
   %%%#/((                                          ,.,/(/#%%%          
   %%%%%%%                                          (((%%%%%%%          
   %%%%%%%                                          %%%%%%%%%%          
   /((/%%%   %%%                             (%%%   %%%%%%%%%%          
       %%%%%%   (((/                      ((/,   %%%%%%%%%*((/          
       %%%%%#   /((/                      (((,   %%%%%%%%%/(((          
          (((%%%%%%%(((                (((%%%%%%%%%%%%%%%%          %%% 
%%%                                       (((((((((((((          %%%@@@ 
   @@@@@@@                                                %%%%%%&(((@@@ 
   @@@@@@@                                                %%%%%%%((/@@@ 
   /((/   %%%%%%                             (%%%%%%%%%   @@@@@@@   (((.
      .(((@@@@@@    %%%%%%%%%   *%%%%%%%%%   #@@@@@@@@@(((@@@@@@@       
      .(((@@@@@@/((/@@@@@@@@@   *@@@@@@@@@   #@@@@@@@@@(((@@@@(((       
       ...***@@@/((/@@@@@@@@@*//(@@@@@@@@@///%@@@@@@@@@...@@@@...       
          (((@@@/((/@@@@@@@@@((((@@@@@@@@@(((%@@@@@@@@@   @@@@          
             @@@@@@&(((@@@@@@((((@@@@@@@@@(((%@@@@@@@@@   /(((          
                (((/   @@@@@@   /@@@@@@@@@   *((((((                    
                       ((((((.  ,(((((((((                              
                       /(((((   ,(((((((((                              
                                                          
```

Dotifles for all my systems:

* Linux
* macOS
* Windows

---

## Claude Integration

Files for consistent Claude Code, Claude Desktop, and MCP config across macOS and WSL.

### File Map

```
dotfiles/
├── .claude/                              # → copies to ~/.claude/
│   ├── CLAUDE.md                         # Global instructions for every session
│   ├── settings.json                     # Permissions, hooks, plugins, UI flags
│   ├── commands/                         # slash commands
│   ├── skills/                           # skills, one <slug>/SKILL.md each
│   ├── agents/                           # subagents
│   └── hooks/                            # hook scripts referenced by settings.json
│       ├── block-sensitive-writes.py     # PreToolUse — blocks .env*/secrets/lockfiles
│       ├── log-bash-command.sh           # PostToolUse — logs Bash to ~/.claude/bash-log.txt
│       ├── prettier-format.sh            # PostToolUse — formats via local prettier
│       ├── notify.sh                     # Notification — osascript / notify-send
│       └── dotfiles-drift-notice.sh      # SessionStart — read-only drift notice
├── .dotfile_scripts/
│   ├── claude_install                    # One-time bootstrap (called by ./install)
│   └── claude_sync                       # Day-to-day: status | push | pull
└── claude-desktop/
    ├── claude_desktop_config.macos.json  # MCP servers for macOS
    └── claude_desktop_config.linux.json  # MCP servers for Linux/WSL
```

### Installation

`./install` calls `claude_install` automatically on both macOS and Linux. Nothing
to wire up by hand.

Set MCP secrets in your shell profile:

```bash
export GOOGLE_STITCH_API_KEY="your-key-here"
```

### Keeping machines in sync

Sync is **manual, always**. Nothing copies `~/.claude` on a timer, a hook, or a git
operation — drift is reported, never acted on.

```bash
claude_sync status   # what has drifted? (read-only, the default)
claude_sync push     # live ~/.claude -> repo, then review + commit yourself
claude_sync pull     # repo -> live ~/.claude (prompts before deleting)
```

A `SessionStart` hook prints a one-line notice when drift exists. It only ever
reports — it does not sync, commit, or fetch:

```
claude-config: 3 file(s) drifted (run: claude_sync status)
```

`claude_sync` touches only the paths in its `CLAUDE_PATHS` allowlist
(`CLAUDE.md settings.json agents commands skills hooks`). Credentials, session
history, plugin caches and `settings.local.json` are outside it by construction.

### What's NOT committed

`.gitignore` uses an **allowlist** for `.claude/` — everything is ignored, then the
six synced paths are re-included. A denylist fails open: anything a future Claude
Code release adds under `~/.claude` would land in this public repo until someone
noticed.

| File | Why |
|------|-----|
| `~/.claude.json` | OAuth tokens, MCP keys, conversation history |
| `~/.claude/.credentials.json` | OAuth access + refresh tokens |
| `~/.claude/settings.local.json` | Machine-specific overrides and project permissions |
| `~/.claude/channels/*/.env` | Bot tokens (Discord) |
| `~/.claude/daemon/control.key`, `ide/*.lock` | Local auth tokens |
| `~/.claude/history.jsonl`, `projects/`, `teams/` | Prompt history and session transcripts |

### Design Notes

- **Copy over symlink** — mainly for control: a symlink makes every edit to
  `~/.claude` instantly live in this repo's working tree, which defeats manual sync.
  Also [#764](https://github.com/anthropics/claude-code/issues/764) (symlinked
  directory traversal) is still open.
  [#3575](https://github.com/anthropics/claude-code/issues/3575) was fixed 2025-07-24.
- **Hooks as files, not JSON strings** — hook logic lives in `.claude/hooks/` so it is
  readable, diffable and testable. `settings.json` only references paths.
- **`python3`, not `jq`** — hooks parse their payload with `python3`. `jq` is not
  installed by default on macOS or a stock Debian/WSL box, and the earlier jq-based
  hooks failed silently for exactly that reason.
- **Platform-split Desktop configs** — macOS and Linux have different paths and MCP roots
- **`${VAR}` expansion** in `.mcp.json` handles secrets portably; Desktop configs require manual env var setup
