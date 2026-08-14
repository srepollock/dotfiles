#!/usr/bin/env bash
# PostToolUse hook: append each executed Bash command to ~/.claude/bash-log.txt.
# Reads the hook payload on stdin. Best-effort — never fails a tool call.
#
# Uses python3 rather than jq: jq is not installed by default on macOS or on a
# stock Debian/WSL box, and the previous jq-based version failed silently for
# exactly that reason.

set -uo pipefail

python3 -c '
import json, sys
try:
    cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
except Exception:
    sys.exit(0)
if cmd:
    print(cmd)
' >>"${HOME}/.claude/bash-log.txt" 2>/dev/null || true

exit 0
