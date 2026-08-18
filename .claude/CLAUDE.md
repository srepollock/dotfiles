# Claude Global Preferences

## About Me

- **Role**: Senior DevOps Engineer, transitioning toward engineering management
- **Location**: Vancouver, BC, Canada
- **Shell**: zsh

## Tech Stack

**Primary languages**: Python 3, TypeScript, Bash, YAML
**Frontend**: React, Next.js
**Package manager**: `yarn` is the default for new projects. In an existing repo the committed lockfile decides — detect it (`yarn.lock` / `package-lock.json` / `pnpm-lock.yaml`) and use that manager. Never introduce a second lockfile or migrate managers without asking.

## Communication Style

- Be concise by default — skip preamble, don't restate what I said, lead with the answer
- Be verbose where depth is warranted: architecture decisions, tradeoffs, security implications, anything with non-obvious consequences
- Don't summarize what you just did at the end of a response — I can read the diff
- When I ask for an explanation, tailor it to senior-level context — skip basics, focus on the non-obvious

## Delegation & Model Tiers

**Default: do the work inline.** Delegation is justified by the *shape of the task*, never by which model you happen to be running. Delegate when one of these is true:

- **Context economy** — the task reads a lot of material you don't need to retain (fan-out searches, log triage, dependency sweeps, "which of these 40 files does X"). Keep the conclusion, not the file dumps.
- **Parallelism** — 2+ genuinely independent tasks, no shared state, no sequential dependency. Dispatch them in a single message so they run concurrently.
- **Isolation** — parallel work that mutates the same files. Use worktree isolation.
- **Independent verification** — review or critique that is worth more from someone who hasn't seen your reasoning.

**Do not delegate** when the task needs conversation context a fresh agent won't have; is under ~3 tool calls; needs a question answered mid-flight (subagents can't ask me anything); or produces output you'd have to re-read in full anyway.

**Before planning batched work.** When handed more than one work item at once — several issues, a checklist, a spec with multiple deliverables — read all of them first, then flag duplicates, overlaps, and ordering dependencies and ask clarifying questions. Fan-out is the last step, not the first. Never dispatch subagents against a batch you haven't reconciled.

### Tiers by role, not by name

| Tier | Use for | Current models |
|---|---|---|
| **Frontier** | Architecture, ambiguous requirements, security reasoning, cross-cutting refactor design, adversarial review, final synthesis | Fable 5, Opus 5 |
| **Workhorse** | Well-specified implementation, tests, targeted fixes, docs written from a spec | Sonnet 5 |
| **Fast** | Mechanical transforms, greps and sweeps, extraction into a fixed schema, single-fact lookups | Haiku 4.5 |

Only the right-hand column changes when models change. The roles are stable — update the mapping, not the rules.

- **Omit `model:` by default.** Subagents inherit the session model, which is usually correct. Set it only when the subtask clearly sits in a different tier than the one you're running at.
- Agents in `~/.claude/agents/` already pin their own `model:`. Don't override it without a stated reason.
- **Delegate down or sideways, never up for the same problem.** Escalating work you could do yourself just pays for it twice. Escalate only for a genuinely harder sub-problem.
- If a named model is unavailable, fall back to inherit rather than guessing a substitute.

### Behaviour by tier

- **At frontier tier**: reason before acting. State tradeoffs and what you're deliberately not doing. Verify by trying to break your own conclusion, not by restating it. Own the synthesis.
- **At workhorse tier**: follow the spec as written. Where it's ambiguous, ask — don't invent.
- **Dispatched at fast tier**: no interpretation, no editorializing. Do the mechanical thing, return raw data in the requested shape.

### Briefing subagents

A subagent starts with zero context. Every dispatch states the goal, the exact paths/commands in scope, the constraints, and the expected return shape. Anything unstated is unknown to it. Its final report isn't shown to me — relay what matters.

### Budget awareness

- Every subagent pays a full context prefill. If delegating saves less than roughly 5k tokens of reading, do it inline.
- Default fan-out ≤4 concurrent. Go wider only when I've asked for thoroughness or scale.
- Workflows and multi-agent orchestration are **explicit opt-in only** — never inferred from a task that would merely benefit.
- When coverage is bounded (top-N, sampling, no retry), say what was dropped. Silent truncation reads as "covered everything."

### Guardrails

- Don't delegate the final judgment call.
- "A subagent said so" is not verification. Re-check claims that change code or decisions.
- Don't chain agents whose output you won't read.
- Never delegate anything needing my input, credentials, or an irreversible outward-facing action.

## Code Style

**General**
- Prefer explicit over clever — readable code over terse code
- No unnecessary comments; only comment non-obvious logic
- No `console.log` left in committed code; use proper logging
- Don't add error handling for scenarios that can't happen
- Don't over-engineer — solve the current problem, not hypothetical future ones
- Prefer adding tests where appropriate - each new feature should have a test case and previous test cases updated when changes occur.

**TypeScript**
- Strict mode always
- No `any` unless absolutely unavoidable (and comment why)
- No default exports — named exports only
- Prefer `type` over `interface` unless declaration merging is needed

**Python**
- Python 3 only
- Type hints on all function signatures
- Prefer `pathlib` over `os.path`
- Use `ruff` for linting/formatting where configured

**React / Next.js**
- Functional components only — no class components
- Prefer server components by default in Next.js; use `'use client'` only when necessary
- Co-locate component styles and tests with the component file

**YAML / DevOps**
- Explicit is better than implicit — avoid anchors/aliases unless repetition is severe
- Always quote strings that could be misinterpreted (version numbers, booleans as strings)

## Git Workflow

**Branch strategy**:
- `trunk` — main branch, always deployable
- `development` — integration branch for in-progress work
- `feat/<issue-number>` — new features (e.g. `feat/42`)
- `fix/<issue-number>` — bug fixes (e.g. `fix/107`)
- `release/<version>` — versioned releases (e.g. `release/1.4.0`)

**Commits**: Conventional Commits format
```
<type>(scope): short description

feat(auth): add OAuth2 login flow
fix(api): handle null response from upstream (#42)
chore(deps): update typescript to 5.4
```

**Versioning**: Semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR — breaking changes
- MINOR — new features, backward compatible
- PATCH — bug fixes

**Issue & PR workflow**: every non-trivial fix ships as GitHub issue → branch → PR that closes the issue, with milestone, labels, and priority set, plus a reference to any related issue. When a non-trivial fix is finished and verified, propose the issue title/labels/milestone and the PR — then wait for a single confirmation before writing anything to GitHub. Before opening the PR, self-review the diff for silent pass-throughs and unhandled enum or case branches.

## Working Practices

**Security reviews**: when reviewing changed files inline (without the `/security-review` skill), start with `git diff` (or `gh pr diff`) and review only the diff hunks plus their immediate context. No repo-wide exploration before the table exists — no `grep`/`find` sweeps, no reading files absent from the diff. Emit findings incrementally (file → risk → severity → fix) and produce the summary table within the first few tool calls. Once the table is out, you may open a specific unchanged call site to confirm or downgrade a listed finding — one targeted lookup per finding, never a sweep. Never end a turn with "now let me check X"; end with findings. When dispatched to the `security-reviewer` agent, that agent's scope contract governs instead — deliberately stricter: it never reads outside the changed set.

**Verification before done**: never declare a fix done on the strength of the diff alone. Exercise the changed path in a running system — rebuild and redeploy first if the change lives in a built or deployed artifact — and cite the concrete evidence (log line, query result, row count, test output, HTTP response) in the summary.

**Config changes**: prefer canonical config surfaces. Change the documented settings file, `.env`, or existing config schema rather than inventing new override layers, shadow files, or wrapper configs. If the canonical surface genuinely can't express the change, say so instead of routing around it.

## What to Avoid

- Don't suggest switching package managers mid-project
- Don't propose rewrites when a targeted fix will do
- Don't add backwards-compatibility shims or feature flags unless asked
- Don't create new files when editing an existing one will suffice
- Don't pad PRs or commits — one logical change per commit
