---
name: start-day
description: Morning workflow kickoff — check project state, review roadmap, suggest next task
allowed-tools: Read Glob Grep Bash(git status) Bash(git log:*) Bash(git branch:*) Bash(git diff:*)
---

## Start-of-Day Checklist

Run the following steps in order:

1. **Check git state**: Run `git status` and `git branch -v` to show current branch and any uncommitted work
2. **Recent history**: Run `git log --oneline -10` to show what happened recently
3. **Read ROADMAP.md**: If a `ROADMAP.md` exists in the project root, read it and identify the current milestone
4. **Read CLAUDE.md**: If a project-level `CLAUDE.md` exists, read it for project-specific context
5. **Stash check**: Run `git stash list` to see if anything was stashed before stepping away
6. **Suggest next action**: Based on the roadmap, recent commits, and any uncommitted changes, recommend what to work on next

Keep the summary concise — this is often read on a phone via Remote Control.
