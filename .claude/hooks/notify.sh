#!/usr/bin/env bash
# Notification hook: cross-platform desktop notification.
# Usage: notify.sh "<message>" ["<title>"]
#
# macOS uses osascript, Linux/WSL uses notify-send. Silently does nothing when
# neither is available (headless, container, CI).

set -uo pipefail

message="${1:-Claude Code needs attention}"
title="${2:-Claude Code}"

if command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"${message}\" with title \"${title}\"" \
        >/dev/null 2>&1 || true
elif command -v notify-send >/dev/null 2>&1; then
    notify-send "${title}" "${message}" >/dev/null 2>&1 || true
fi

exit 0
