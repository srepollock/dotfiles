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
│   ├── settings.json                     # Permissions, hooks, env vars
│   ├── commands/
│   │   └── commit.md                     # /user:commit — conventional commit helper
│   ├── skills/
│   │   ├── start-day/SKILL.md            # /start-day — morning workflow kickoff
│   │   ├── review/SKILL.md               # /review — code review in forked subagent
│   │   ├── pr/SKILL.md                   # /pr — generate PR description
│   │   ├── rc/SKILL.md                   # /rc — show Remote Control URL
│   │   └── compact-safe/SKILL.md         # /compact-safe — compact with state capture
│   ├── agents/                           # subagents
│   └── rules/                            # glob-scoped rules
├── .dotfile_scripts/
│   └── claude_install                    # Setup script
└── claude-desktop/
    ├── claude_desktop_config.macos.json  # MCP servers for macOS
    └── claude_desktop_config.linux.json  # MCP servers for Linux/WSL
```

### Installation

1. Append `claude.gitignore` to your `.gitignore` (or run the install script)
2. Add to your `install` script (darwin and linux cases):
   ```bash
   ./.dotfile_scripts/claude_install
   ```
3. Set MCP secrets in your shell profile:
   ```bash
   export GOOGLE_STITCH_API_KEY="your-key-here"
   ```

### What's NOT committed

| File | Why |
|------|-----|
| `~/.claude.json` | OAuth tokens, MCP keys, conversation history |
| `~/.claude/.credentials.json` | OAuth tokens (Linux/WSL) |
| `~/.claude/settings.local.json` | Machine-specific overrides |
| `~/.claude/projects/` | Session history and auto-memory |

### Design Notes

- **Copy over symlink** — symlinked configs have known bugs ([#3575](https://github.com/anthropics/claude-code/issues/3575), [#764](https://github.com/anthropics/claude-code/issues/764))
- **Platform-split Desktop configs** — macOS and Linux have different paths and MCP roots
- **`${VAR}` expansion** in `.mcp.json` handles secrets portably; Desktop configs require manual env var setup
