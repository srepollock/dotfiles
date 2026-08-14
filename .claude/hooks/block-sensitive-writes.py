#!/usr/bin/env python3
"""PreToolUse hook: block Edit/Write against secret files and lockfiles.

Reads the hook payload on stdin and emits a block decision on stdout when the
target should not be written directly. Silence means "allowed".
"""

import json
import sys
from pathlib import Path

SENSITIVE = {
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    "credentials.json",
    "secrets.yaml",
    "secrets.yml",
    ".npmrc",
    ".pypirc",
}

LOCKFILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Cargo.lock",
    "poetry.lock",
    "Pipfile.lock",
    "composer.lock",
}


def block(reason: str) -> None:
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


def main() -> None:
    data = json.load(sys.stdin)
    path = data.get("tool_input", {}).get("file_path", "")
    name = Path(path).name

    if (name in SENSITIVE or name.startswith(".env")) and not name.endswith(".template"):
        block(f"Blocked edit to sensitive file: {path}")

    if name in LOCKFILES:
        block(
            "Lock files should only be modified by package managers, "
            f"not directly: {path}"
        )


if __name__ == "__main__":
    main()
