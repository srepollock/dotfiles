---
name: issue
description: Create a formatted GitHub issue with gh CLI, applying triage priority labels
---

# Issue — GitHub Issue Creator (Universal)

Creates a properly formatted GitHub issue using `gh` CLI for any GitHub repository with a configurable triage priority system.

---

## Triage Priority System (Customizable)

Default priority mapping (adjust per project):

| Priority | Category                        |
| -------- | ------------------------------- |
| `1`      | Critical / Security issues      |
| `2`      | High / Backend / Infrastructure |
| `3`      | Medium / Frontend / Application |
| `4`      | Low / Integration / Testing     |
| `5`      | Minimal / Docs / Chores         |

Sub-priorities use decimals: `1.2`, `2.5`, `3.1`, etc. (lower decimal = higher priority within category).

---

## Step 1 — Identify the Repository

Ask the user:

- **GitHub repo** in format `owner/repo` (e.g., `myorg/my-project`)
    - If not provided, confirm the repo before proceeding

---

## Step 2 — Gather Issue Details

Ask the user:

1. **Title** — concise, imperative (e.g., "Add Robinhood broker integration")
2. **Type**: bug / feature / chore / security / testing / docs / enhancement
3. **Description** — what's the problem or goal?
4. **Steps to reproduce** (for bugs only)
5. **Proposed solution** (optional)
6. **Priority**: suggest based on type and project conventions, confirm with user
7. **Assignee** (optional): GitHub username
8. **Related issue(s)** (optional): links to related issues

---

## Step 3 — Check Available Milestones

```bash
gh milestone list --repo {owner/repo}
```

Ask the user which milestone this issue belongs to (or none if it's a standalone task).

---

## Step 4 — Check Available Labels

```bash
gh label list --repo {owner/repo}
```

Suggest labels based on issue type; confirm with user.

---

## Step 5 — Preview and Confirm

Build the issue content and show a preview before creating:

**For a bug:**

```markdown
## Summary

[What is broken and what is the impact?]

## Steps to Reproduce

1. Step one
2. Step two
3. Observe the bug

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Environment

- Branch:
- Environment (local/staging/production):

## Proposed Fix

[Optional — if the developer already knows the solution]

## Priority

{PRIORITY} — {CATEGORY}
```

**For a feature:**

```markdown
## Summary

[What needs to be built and why]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests added

## Technical Notes

[Any relevant implementation notes, related files, or architectural considerations]

## Priority

{PRIORITY} — {CATEGORY}
```

**For a chore/docs:**

```markdown
## Description

[What needs to be done and why]

## Acceptance Criteria

- [ ] Task 1
- [ ] Task 2

## Priority

{PRIORITY} — {CATEGORY}
```

---

## Step 6 — Create the Issue

```bash
gh issue create \
  --repo {owner/repo} \
  --title "{title}" \
  --body "{body}" \
  --label "{label1,label2}" \
  --milestone "{Milestone Name}"
```

Optional flags:

- `--assignee {username}` — assign to a user
- Remove `--milestone` if none selected

Example:

```bash
gh issue create \
  --repo myorg/my-project \
  --title "Add user authentication flow" \
  --body "$(cat <<'EOF'
## Summary
Need to implement login/signup flow for web app

## Acceptance Criteria
- [ ] Login form works
- [ ] Signup validation added
- [ ] Tests cover auth flow

## Technical Notes
Use Firebase Auth library

## Priority
2.1 — High / Backend
EOF
)" \
  --label "feature,backend" \
  --milestone "Q2 2024"
```

---

## Step 7 — Output the Issue URL

After creation, share the new issue:

```
✓ Created issue #NNN: https://github.com/{owner/repo}/issues/NNN
```

---

## Useful Commands

**List issues in a repo:**

```bash
gh issue list --repo {owner/repo}
```

**View issue details:**

```bash
gh issue view {issue-number} --repo {owner/repo}
```

**Check project boards:**

```bash
gh project list --owner {owner}
```

---

## Branch Naming Convention (Optional Reminder)

Common conventions (confirm with project):

- Feature: `feat/{issue-number}` (e.g., `feat/142`)
- Bug fix: `fix/{issue-number}` (e.g., `fix/143`)
- Chore: `chore/{issue-number}` (e.g., `chore/55`)
- Hotfix: `hotfix/{issue-number}`

```bash
git checkout -b feat/{issue-number}
```

---

## Customization Notes

Each project may have different:

- **Priority systems** — adjust the mapping table above
- **Required labels** — check what's standard for the project
- **Milestone naming** — confirm release/sprint structure
- **Acceptance criteria format** — adapt templates to project needs
- **Related links** — link to docs, design specs, or architecture ADRs as needed

Ask the user about project conventions at the start if they're not obvious.
