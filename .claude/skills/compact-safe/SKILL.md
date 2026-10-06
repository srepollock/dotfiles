---
name: compact-safe
description: Compact the conversation while preserving key session state
allowed-tools: Read Bash(git status:*) Bash(git branch:*) Bash(git stash:*)
---

Before compacting, capture and display the current session state:

1. Run `git status --short` and `git branch --show-current`
2. Note any uncommitted changes or stashed work
3. If a ROADMAP.md exists, note the current task/milestone being worked on
4. Summarize what we were just working on in 1-2 sentences

Then print a ready-to-paste `/compact <summary>` line whose summary includes all of the above,
so I can run it and the post-compact session picks up exactly where we left off.
