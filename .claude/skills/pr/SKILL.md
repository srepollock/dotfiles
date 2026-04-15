---
name: pr
description: Generate a pull request description from the current branch diff against trunk
context: fork
allowed-tools: Read Grep Glob Bash(git diff:*) Bash(git log:*) Bash(git branch:*)
---

## Branch Context

- **Current branch**: !`git branch --show-current`
- **Diff from trunk**: !`git diff trunk --stat`
- **Commits on branch**: !`git log trunk..HEAD --oneline`

## Instructions

Write a clear, well-structured PR description with these sections:

### Summary
A 2-3 sentence overview of what this PR does and why.

### Changes
Bullet list of the key changes, grouped logically (not file-by-file).

### Testing
Describe what was tested. If tests were added or modified, mention them.
If no tests exist yet, note what should be tested.

### Migration / Breaking Changes
Only include this section if there are breaking changes, new environment variables,
database migrations, or configuration changes required.

Output the PR description in markdown, ready to paste into GitHub.
