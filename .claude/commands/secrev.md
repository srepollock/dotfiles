---
description: Diff-scoped security review — fans out three security-reviewer agents in parallel and merges their findings into one ranked table
argument-hint: "[git range — e.g. origin/trunk...HEAD, --staged, abc123..HEAD]"
---

Run a three-way parallel security review of the current changes and merge the results into one ranked table.

## 1. Resolve scope once

Do this in the parent, so all three agents agree and the header is truthful.

- If `$ARGUMENTS` is non-empty, it is the range. It wins outright.
- Otherwise auto-detect: `git status --porcelain` non-empty → `UNCOMMITTED` (diff against `HEAD`); else → `origin/trunk...HEAD`.
- Guard the empty repo: if `git rev-parse --verify HEAD` fails there are no commits, so there is no tracked diff at all. Report the range as `UNCOMMITTED (no HEAD — untracked only)` and skip every `git diff` against `HEAD`; a bare `git diff HEAD` fatals in this state.

Then count what is in scope:

```
git diff --stat <range> | tail -1
git ls-files --others --exclude-standard | wc -l
```

Print exactly one scope line before anything else:

`Scope: <resolved range> — N tracked file(s), M untracked file(s)`

If both counts are zero, print `Nothing to review in <range>.` and stop. Do not dispatch agents.

## 2. Fan out three agents

Dispatch all three `security-reviewer` agents **in a single message** so they run concurrently.

| CATEGORY | model |
|---|---|
| `secrets` | `sonnet` |
| `injection` | `sonnet` |
| `authz` | `fable` |

If a model is unavailable — spend limit, capacity, or a terminal API error — re-dispatch that category with an **explicit** override to an available model of the same tier (`authz` is frontier: `opus`). Omitting the override does not inherit the session model; it falls back to the agent frontmatter's own `model: fable` pin and fails identically. Never silently drop the category — note the fallback in the footer.

Each brief must be self-contained — the agent has none of this conversation. State in every brief:

- The resolved `RANGE` string, verbatim.
- Its single `CATEGORY`.
- That its budget is 15 tool calls and it must emit its table at that point regardless.
- That its table is the return value, not a message to a human.

## 3. Merge

- Concatenate all rows from the three tables.
- **Dedupe on `File:Line`.** Keep the highest severity; join the category labels with a comma (`secrets, injection`).
- Sort `CRITICAL` → `HIGH` → `MEDIUM` → `LOW`, then by `File:Line`.
- Render one table, with a `Category` column inserted after `Severity`:

| Severity | Category | File:Line | Issue | Exploit scenario | Fix |
|---|---|---|---|---|---|

## 4. Footer

One rollup line: `No issues found in: <comma-separated empty categories>` — or `No issues found in: (none — all 3 categories reported findings)`.

If an agent returned nothing, or output that could not be parsed as a table, name it explicitly:

`Category <name> returned no usable output — treat as unreviewed.`

Never silently drop a category.

Report findings only. Do not fix anything unless I ask.
