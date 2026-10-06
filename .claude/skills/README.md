# Claude Code skills & mods

This folder is the source of `~/.claude/skills/`. It is synced by `.dotfile_scripts/claude_sync pull` (repo to `~/.claude`) and `claude_sync push` (`~/.claude` to repo).

Claude Code loads skills from `~/.claude/skills/<name>/SKILL.md`. You invoke one as `/<name>`, or Claude picks it automatically from its description. Mods are function-hook plugins that auto-load from a plugin folder under `~/.claude/skills/<name>/`.

## Skills

| Skill | Use it for | Notes |
| --- | --- | --- |
| [`/ast-refactorer`](./ast-refactorer/SKILL.md) | Safe, automated code transformations using AST manipulation. | |
| [`/changelog-generator`](./changelog-generator/SKILL.md) | Generating or appending to a `CHANGELOG.md` from relevant commits. | |
| [`/compact-safe`](./compact-safe/SKILL.md) | Compacting the conversation while preserving key session state. | |
| [`/grill-me`](./grill-me/SKILL.md) | Being interviewed relentlessly about a plan or design until it is fully stress-tested. | |
| [`/mock-server-factory`](./mock-server-factory/SKILL.md) | Generating and managing local mock servers from OpenAPI, GraphQL, or Protobuf specs. | |
| [`/pr`](./pr/SKILL.md) | Writing a pull request description from the current branch diff against `trunk`. | Runs in a fork |
| [`/rc`](./rc/SKILL.md) | Showing the current Remote Control URL and session info for phone access. | User-invoked only |
| [`/review`](./review/SKILL.md) | Reviewing recent changes for code quality, security, and test coverage gaps. | Runs in a fork |
| [`/roadmap-generator`](./roadmap-generator/SKILL.md) | Generating a `ROADMAP.md` from the GitHub project, issues, milestones, and goals. | |
| [`/sandbox-manager`](./sandbox-manager/SKILL.md) | Running code, reproductions, and baseline tests in ephemeral Docker/Podman environments. | |
| [`/security-review`](./security-review/SKILL.md) | Diff-scoped security review of changed files. | |
| [`/security-scanner`](./security-scanner/SKILL.md) | Running Snyk, Bandit, npm audit and similar tools to confirm vulnerabilities. | |
| [`/ship-changes`](./ship-changes/SKILL.md) | Shipping local changes end-to-end: commit, issue, `feat/` or `fix/` branch, PR, project board. | |
| [`/start-day`](./start-day/SKILL.md) | Morning kickoff: check project state, review the roadmap, suggest the next task. | |
| [`/telemetry-analyzer`](./telemetry-analyzer/SKILL.md) | Parsing logs, profiles, and telemetry to find bottlenecks and runtime errors. | |
| [`/to-issues`](./to-issues/SKILL.md) | Breaking a plan, spec, or PRD into independently-grabbable tracker issues (tracer-bullet slices). | |
| [`/to-prd`](./to-prd/SKILL.md) | Turning the current conversation into a PRD and publishing it to the issue tracker. | |
| [`/tribunal`](./tribunal/SKILL.md) | A five-agent panel review (Architect, Shield, Optimizer, Maintainer, Tester) of any codebase. | |
| [`/update-version`](./update-version/SKILL.md) | Updating the project version. | |
| [`/workspace-indexer`](./workspace-indexer/SKILL.md) | Retrieving design intent from docs, ADRs, and historical code comments. | |

## Mods

| Mod | What it does |
| --- | --- |
| [`context-bar`](./context-bar/README.md) | Draws the context window as a stacked bar above the prompt, one colour per `/context` category; toggle with `/context-bar`. |
| [`delegate-guard`](./delegate-guard/README.md) | Nudges the main agent to delegate to subagents when it pulls too much material into its own context, and records nudge stats per session. |
| [`savvy-progress`](./savvy-progress/README.md) | A progress bar above the prompt and a live agents panel. Shows any subagents. |

### Installing a mod

```
/plugin install <mod> --marketplace srepollock/dotfiles
```

Answer `y` to add the marketplace, then choose a scope. The marketplace file is `.claude-plugin/marketplace.json` at the repo root.

- **Dotfiles route:** run `.dotfile_scripts/claude_sync pull` to copy the mod into `~/.claude/skills/<mod>/`, where it auto-loads.
- **Ad hoc:** `claude --plugin-dir <path>` loads a mod for a single session.

## Adding to this folder

- New skill: create `<name>/SKILL.md` with YAML frontmatter (`name`, `description`, optionally `context: fork`, `disable-model-invocation: true`, `allowed-tools`).
- New mod: create a plugin folder (`.claude-plugin/plugin.json` plus `hooks/`) and add an entry to `.claude-plugin/marketplace.json`.
- Check mods with `claude plugin validate <folder>` and `claude plugin test <folder>`.
- If you edit directly in `~/.claude`, run `claude_sync push` to bring the changes back into the repo.
