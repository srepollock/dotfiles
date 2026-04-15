---
name: compact-safe
description: Compact the conversation while preserving key session state
allowed-tools: Read Bash(git status) Bash(git branch:*) Bash(git stash:*)
---

Before compacting, capture and display the current session state:

1. Run `git status --short` and `git branch --show-current`
2. Note any uncommitted changes or stashed work
3. If a ROADMAP.md exists, note the current task/milestone being worked on
4. Summarize what we were just working on in 1-2 sentences

Then run `/compact` with a summary that includes all of the above context,
so the post-compact session can pick up exactly where we left off.
