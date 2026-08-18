---
name: security-review
description: Diff-scoped security review of changed files
---

Dispatch a single `security-reviewer` agent against the current changes.

1. Resolve the range: `git status --porcelain` non-empty → `UNCOMMITTED` (diff against `HEAD`); else `origin/trunk...HEAD`.
2. Dispatch one `security-reviewer` agent with that `RANGE` and no `CATEGORY`, so it applies all three lenses in a single pass.
3. Print the agent's table verbatim. The agent owns the output format — do not reshape it.

For a deeper pass, `/secrev` fans the same agent out three ways, one per category, and merges the tables.
