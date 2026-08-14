#!/usr/bin/env bash
# SessionStart hook: passive, read-only notice when ~/.claude has drifted from
# the dotfiles repo.
#
# This hook NEVER writes, syncs, commits, or fetches. It reports; you decide
# when to run `claude_sync push`. No network I/O, so it stays fast and cannot
# stall session start.
#
# Exits silently (0) when the dotfiles repo is not present, so a fresh machine
# or a container never sees an error.

set -uo pipefail

DOTFILES_DIR="${DOTFILES_DIR:-${HOME}/documents/projects/dotfiles}"
REPO_CLAUDE="${DOTFILES_DIR}/.claude"
LIVE_CLAUDE="${HOME}/.claude"

[ -d "${REPO_CLAUDE}" ] || exit 0

# Keep in sync with CLAUDE_PATHS in .dotfile_scripts/claude_sync
PATHS=(CLAUDE.md settings.json agents commands skills hooks)

drifted=0
for p in "${PATHS[@]}"; do
    live="${LIVE_CLAUDE}/${p}"
    repo="${REPO_CLAUDE}/${p}"

    if [ ! -e "${live}" ] && [ ! -e "${repo}" ]; then
        continue
    fi

    if [ ! -e "${live}" ] || [ ! -e "${repo}" ]; then
        drifted=$((drifted + 1))
        continue
    fi

    n="$(diff -rq "${repo}" "${live}" 2>/dev/null | wc -l | tr -d ' ')"
    drifted=$((drifted + n))
done

unpushed=0
if git -C "${DOTFILES_DIR}" rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
    unpushed="$(git -C "${DOTFILES_DIR}" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)"
fi

if [ "${drifted}" -eq 0 ] && [ "${unpushed}" -eq 0 ]; then
    exit 0
fi

parts=""
[ "${drifted}" -gt 0 ] && parts="${drifted} file(s) drifted"
if [ "${unpushed}" -gt 0 ]; then
    [ -n "${parts}" ] && parts="${parts}, "
    parts="${parts}${unpushed} unpushed commit(s)"
fi

printf 'claude-config: %s (run: claude_sync status)\n' "${parts}"

exit 0
