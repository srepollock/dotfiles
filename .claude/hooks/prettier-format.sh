#!/usr/bin/env bash
# PostToolUse hook: format the file just written, using the project's own
# prettier. Reads the hook payload on stdin.
#
# Two deliberate choices:
#   - python3 instead of jq (jq is not installed by default anywhere we run).
#   - node_modules/.bin/prettier instead of npx: no implicit package installs,
#     no network, and nothing happens in projects that do not use prettier.

set -uo pipefail

file="$(python3 -c '
import json, sys
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("file_path", ""))
except Exception:
    pass
' 2>/dev/null)"

[ -n "${file}" ] || exit 0
[ -f "${file}" ] || exit 0

root="$(git -C "$(dirname "${file}")" rev-parse --show-toplevel 2>/dev/null || pwd)"
prettier="${root}/node_modules/.bin/prettier"

if [ -x "${prettier}" ]; then
    "${prettier}" --write "${file}" >/dev/null 2>&1 || true
fi

exit 0
