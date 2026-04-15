---
name: rc
description: Display the current Remote Control URL and session info for phone access
disable-model-invocation: true
allowed-tools: Bash(echo:*)
---

Print the current Remote Control connection info so I can access this session from my phone.

Run: `echo "Remote Control URL: $(cat /tmp/claude-rc-url 2>/dev/null || echo 'Not found — start session with: claude --remote-control')"`

Also show:
- Current working directory
- Current git branch
- How long the session has been active (if determinable)

Keep output minimal — this is read on a phone screen.
