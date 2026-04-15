---
name: review
description: Review recent changes for code quality, security, and test coverage gaps
context: fork
allowed-tools: Read Grep Glob Bash(git diff:*) Bash(git log:*) Bash(git show:*)
---

## Changes to Review

!`git diff --name-only HEAD~1`

## Review Criteria

Analyze the above changed files for:

1. **Code quality**: Dead code, unclear naming, overly complex logic, missing types
2. **Security**: Hardcoded secrets, unsanitized input, exposed endpoints, SQL injection vectors
3. **Error handling**: Swallowed errors, missing catch blocks, unhandled promise rejections
4. **Test coverage**: New logic paths without corresponding tests, changed behavior without updated tests
5. **Performance**: N+1 queries, unnecessary re-renders, blocking I/O in hot paths, large bundle additions
6. **Conventions**: Conventional commit compliance, consistent formatting, project-specific patterns from CLAUDE.md

For each issue found, provide:
- File and approximate location
- Severity (critical / warning / suggestion)
- Specific fix recommendation

If everything looks good, say so briefly. Don't pad the response.
