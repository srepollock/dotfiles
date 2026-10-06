---
name: sandbox-manager
description: Manages ephemeral, restricted environments (Docker/Podman) for safe code execution, reproduction, and baseline testing.
---

# 🛡️ Sandbox Manager

This skill allows the Bug-Fixer and Tester to execute code without risking the primary development environment.

## ⚖️ Usage Protocol

1. **Environment Setup**: Define a minimal container image matching the project's detected stack (Node, Python, Go, etc.).
2. **Execution Phase**: Mount the local code as read-only (or a cloned temporary directory) and run the project's test command (what `~/.claude/skills/tribunal/tester.sh` detects) or specific reproduction scripts.
3. **Capture Phase**: Log all output, exit codes, and resource usage metrics.
4. **Cleanup Phase**: Terminate and remove the container immediately after execution.

## 🛠️ Technical Standards

- Never run containers as `root`.
- Disable network access for test runs unless the Integration Specialist explicitly requests a "Live Integration Test."
- Limit memory and CPU to prevent runaway processes from impacting the host.
