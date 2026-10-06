---
name: ship-changes
description: >
  Use this skill to ship local branch changes end-to-end: commit uncommitted work,
  create a GitHub issue from the diff against the target branch, create a properly named
  `feat/<issue-number>` or `fix/<issue-number>` branch, push it, create a PR that
  targets the base branch and closes the issue, and add both the issue and PR to the
  GitHub project board. Use when the user asks to ship or package local changes
  for review, or to open an issue and PR for them.
---

# Ship Changes — Issue + Branch + PR Pipeline

Automates the full workflow from local changes to a reviewable PR against a target branch:

1. Commit any uncommitted work
2. Analyse the diff against the target branch
3. Create a GitHub issue describing the work
4. Create a `feat/<#>` or `fix/<#>` branch with the changes
5. Push the branch and open a PR that closes the issue
6. Add both the issue and PR to the GitHub project board

---

## Configuration

Resolve these values at the start and use them throughout:

| Key | Source |
|-----|--------|
| `REPO_OWNER`, `REPO_NAME` | `gh repo view --json owner,name` |
| `TARGET_BRANCH` | `development` unless the user named another; confirmed in Step 5 |
| `PROJECT_NUMBER` | `gh project list --owner $REPO_OWNER`; if there is more than one, pick the likeliest and confirm it in Step 5 |

---

## Step 1 — Ensure a Clean Working Tree

Check for uncommitted changes (staged + unstaged + untracked):

```bash
git status --porcelain
```

If there is output (uncommitted work exists):

1. Stage all relevant changes (`git add` specific files — avoid secrets like `.env`).
2. Create a commit with a descriptive message summarising the work.
3. Confirm the working tree is now clean.

If the tree is already clean, skip to Step 2.

---

## Step 2 — Fetch Latest and Diff Against Target Branch

```bash
git fetch origin $TARGET_BRANCH
```

Generate the full diff and a stat summary:

```bash
git diff origin/$TARGET_BRANCH...HEAD --stat
git diff origin/$TARGET_BRANCH...HEAD
git log origin/$TARGET_BRANCH...HEAD --oneline
```

Use these to understand **what changed** and **why**. This analysis drives the issue title, description, labels, and PR content in later steps.

Self-review the diff for silent pass-throughs and unhandled enum or case branches. Report any you find before continuing — they get fixed before anything ships.

---

## Step 3 — Infer Change Type

Analyse the diff, commit messages, and current branch name to infer whether this is a **feature** (`feat`) or **bug fix** (`fix`).

**Inference heuristics (in priority order):**

1. Commit message prefixes: `feat:` / `fix:` / `bugfix:` etc.
2. Current branch name pattern: `feat/*`, `fix/*`, `hotfix/*`
3. Nature of the changes: new files/endpoints = feature; patching existing logic = fix

The inferred type goes into the single proposal in Step 5.

---

## Step 4 — Fetch Labels and Milestones from GitHub

Always refresh labels and milestones before applying. Run both in parallel:

```bash
gh label list --repo $REPO_OWNER/$REPO_NAME --limit 100 --json name,description
gh api repos/$REPO_OWNER/$REPO_NAME/milestones --jq '.[] | {number: .number, title: .title}'
```

Select the most appropriate labels based on the change type and affected areas, a priority (as a priority label if the repo has them), and the milestone that fits. These go into the single proposal in Step 5; the milestone is applied to both the issue and the PR.

---

## Step 5 — Find Related Issues and Confirm Once

Derive 2–5 feature keywords from the diff and commit messages (e.g. `ship changes skill`, `retry logic`).

```bash
gh issue list \
  --repo $REPO_OWNER/$REPO_NAME \
  --search "is:open <feature keywords>" \
  --limit 10 \
  --json number,title,url
```

Then present one proposal and wait for a single confirmation. Nothing is written to GitHub before it:

- Type (`feat` / `fix`)
- Issue: reuse an existing match (#NNN), or the new issue's title
- Labels, priority, and milestone
- Related issues to reference (other matches from the search)
- PR title, base branch (`$TARGET_BRANCH`), and project board (`$PROJECT_NUMBER`)

Apply any corrections from that one reply. If the user picks an existing issue, capture its number and **skip Step 6**.

---

## Step 6 — Create the GitHub Issue

Build the issue body from the diff analysis.

**For a feature:**
```markdown
## Summary
[What is being added and why — derived from the diff and commit messages]

## Changes
- [Bullet list of key changes from the diff stat]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests added

## Technical Notes
[Relevant files, architectural considerations, or dependencies]

## Priority
[Priority confirmed in Step 5]

## Related
[Related issues from Step 5, or omit]
```

**For a bug fix:**
```markdown
## Summary
[What was broken and how it is being fixed]

## Root Cause
[What caused the bug — derived from the diff]

## Changes
- [Bullet list of key changes from the diff stat]

## Verification
- [ ] Fix verified locally
- [ ] Tests added/updated

## Priority
[Priority confirmed in Step 5]

## Related
[Related issues from Step 5, or omit]
```

Create the issue with the confirmed labels and milestone:

```bash
gh issue create \
  --repo $REPO_OWNER/$REPO_NAME \
  --title "<concise imperative title>" \
  --body "$(cat <<'EOF'
<issue body here>
EOF
)" \
  --label "<label1>,<label2>" \
  --milestone "<milestone title>"   # omit only if the repo has no milestones
```

Capture the issue number from the output URL (e.g., `https://github.com/.../issues/NNN` -> `NNN`).

If an **existing issue** was selected in Step 5 and it has no milestone set, apply the confirmed milestone now:

```bash
gh issue edit <NNN> --repo $REPO_OWNER/$REPO_NAME --milestone "<milestone title>"
```

---

## Step 7 — Add the Issue to the GitHub Project

```bash
gh project item-add $PROJECT_NUMBER --owner $REPO_OWNER --url https://github.com/$REPO_OWNER/$REPO_NAME/issues/<NNN>
```

Confirm the issue was added to the project board.

---

## Step 8 — Create and Push the Branch

Using the issue number and inferred type from Step 3:

```bash
# Create the new branch from the current HEAD
git checkout -b <type>/<issue-number>

# Push and set upstream
git push -u origin <type>/<issue-number>
```

Where `<type>` is `feat` or `fix` and `<issue-number>` is the number from Step 5 (existing issue) or Step 6 (new issue).

**Note:** All commits from the current branch carry over since the new branch is created from HEAD.

---

## Step 9 — Create the Pull Request

Build the PR body from the diff analysis. Include an auto-generated **manual test checklist** based on what changed.

**Test checklist generation heuristics:**

| Change area | Checklist items |
|-------------|----------------|
| API endpoints | `[ ] Hit endpoint manually via curl/Postman and verify response` |
| Frontend components | `[ ] Visually verify component renders correctly in browser` |
| Business logic | `[ ] Run locally and verify functionality works end-to-end` |
| Database/models | `[ ] Verify data migration and schema changes` |
| Config/env changes | `[ ] Verify environment variables are documented and set` |
| Docker/infra | `[ ] Verify containers build and start cleanly` |
| Auth/security | `[ ] Verify authentication flow end-to-end` |
| Dependencies | `[ ] Verify no breaking changes from dependency updates` |

Always include:
- `[ ] Smoke test passes locally`
- `[ ] No regressions in related features`

```bash
gh pr create \
  --repo $REPO_OWNER/$REPO_NAME \
  --base $TARGET_BRANCH \
  --head <type>/<issue-number> \
  --title "<PR title>" \
  --milestone "<milestone title>" \
  --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing the changes>

Closes #<issue-number>

## Changes
- [Bullet list of key changes]

## Manual Test Plan
- [ ] <auto-generated checklist item 1>
- [ ] <auto-generated checklist item 2>
- [ ] Smoke test passes locally
- [ ] No regressions in related features

---
Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Omit `--milestone` only if the repo has no milestones.

The PR body includes `Closes #<issue-number>` so the issue auto-closes on merge.

---

## Step 10 — Add the PR to the GitHub Project

```bash
gh project item-add $PROJECT_NUMBER --owner $REPO_OWNER --url https://github.com/$REPO_OWNER/$REPO_NAME/pull/<PR-number>
```

Capture the PR number from the `gh pr create` output URL.

---

## Step 11 — Final Summary

Present a summary to the user:

```
Ship complete!

  Issue:  #<NNN> — <title>
          https://github.com/$REPO_OWNER/$REPO_NAME/issues/<NNN>

  Branch: <type>/<NNN>

  PR:     #<PR-number> — <title>
          https://github.com/$REPO_OWNER/$REPO_NAME/pull/<PR-number>

  Milestone: <milestone title or "none">
  Project:   Added to project #$PROJECT_NUMBER

  Next steps:
  - Request reviewers on the PR if needed
```

---

## Error Handling

- If `gh` commands fail due to missing scopes, prompt the user to run:
  ```bash
  gh auth refresh -s read:project,project
  ```
- If the branch name already exists, ask the user whether to force-update or pick an alternative name.
- If the diff against `$TARGET_BRANCH` is empty, abort and inform the user there are no changes to ship.
