# Global Development Context

## Environment
- Primary: macOS (M-series MacBook), secondary: WSL2 Ubuntu on Windows
- Shell: zsh
- Node via nvm, Python via pyenv
- tmux for session persistence

## Coding Standards
- TypeScript for all new code, strict mode enabled
- Prefer functional patterns; avoid classes unless modeling stateful entities
- Error handling: never swallow errors silently; use Result types where possible
- Conventional commits: feat:, fix:, chore:, docs:, refactor:, test:

## Workflow Principles
- Run tests before committing: `npm test`, `bun test`, or `pytest`
- Small, focused commits over large changesets
- Always check `git status` before staging
- Use Plan Mode (Shift+Tab) before large tasks to outline approach
- Maintain CLAUDE.md + ROADMAP.md in every active project
- `/compact` before stepping away to preserve session continuity

## Git Practices
- Default branch: trunk (not main)
- Rebase over merge for feature branches
- Push before opening PRs; let CI validate

## Remote Work
- Sessions are often managed via Remote Control from phone
- Keep responses concise when possible — mobile readability matters
- If a long-running task finishes, summarize the outcome clearly

## Tool Preferences
- Prefer `bun` over `npm` where supported
- Use `npx` for one-off MCP server execution
- Prefer built-in Node/Bun APIs over adding dependencies
