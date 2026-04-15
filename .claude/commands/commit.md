Stage and commit the current changes with a conventional commit message.

1. Run `git status` and `git diff --staged` to understand what's changed
2. If nothing is staged, intelligently stage the appropriate files (skip unrelated changes)
3. Generate a conventional commit message: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
4. If I provided a message as an argument, use that: $ARGUMENTS
5. If no argument provided, generate an appropriate message from the diff
6. Commit with the message
7. Show the resulting `git log --oneline -1`

Do NOT push automatically — I'll push when ready.
