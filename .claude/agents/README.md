# Claude Code Agent Definitions

These agent definition files (`.md`) are loaded by **Claude Code** and follow Claude Code's agent frontmatter format (`model`, `tools`, `memory` fields).

## Relationship to `.github/agents/`

The `.github/agents/` directory contains equivalent agent definitions for **GitHub Copilot**. The two directories serve different AI platforms and use different frontmatter schemas:

- `.claude/agents/*.md` — Claude Code format (`model: opus`, `tools: Read, Grep, ...`)
- `.github/agents/*.agent.md` — GitHub Copilot format (`model: [list]`, `tools: [array]`)

The duplication is **intentional**: each platform requires its own file format. `AGENTS.md` at the project root serves as the canonical source for shared guidelines. When updating agent behavior, changes should be applied to both directories to keep them consistent.
