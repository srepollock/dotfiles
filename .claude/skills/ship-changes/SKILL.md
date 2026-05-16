---
name: ship-changes
description: >
  Use this skill to ship local branch changes end-to-end: commit uncommitted work,
  create a GitHub issue from the diff against the target branch, create a properly named
  `feat/<issue-number>` or `fix/<issue-number>` branch, push it, create a PR that
  targets the base branch and closes the issue, and (optionally) add both the issue and
  PR to a GitHub project board.
  Trigger on: "ship changes", "create issue and pr", "issue and pr", "ship it",
  "package changes", "ship my work", "prep for review", "open issue and pr",
  "send changes", "push and pr".
---

# Ship Changes — Issue + Branch + PR Pipeline

Automates the full workflow from local changes to a reviewable PR against a target branch:

1. Commit any uncommitted work
2. Analyse the diff against the target branch
3. Create a GitHub issue describing the work
4. Create a `feat/<#>` or `fix/<#>` branch with the changes
5. Push the branch and open a PR that closes the issue
6. Optionally add both the issue and PR to a GitHub project board

This skill is **project-agnostic**. All repo-specific values are auto-detected from the local `git` and `gh` state where possible, and prompted for otherwise. Nothing is hard-coded to a specific repository.

---

## Step 0 — Resolve Repository Context

Auto-detect the values needed for later steps. Run these in parallel:

```bash
# Repo owner/name from the origin remote
gh repo view --json owner,name,defaultBranchRef --jq '{owner: .owner.login, name: .name, default: .defaultBranchRef.name}'

# Current branch
git rev-parse --abbrev-ref HEAD

# List of GitHub projects the user/org owns (for optional board attachment)
gh project list --owner "@me" --format json 2>/dev/null || true
```

From the output, set the following context variables for the rest of the workflow:

| Key | How to resolve |
|-----|---------------|
| `REPO_OWNER` | From `gh repo view` (`.owner.login`) |
| `REPO_NAME` | From `gh repo view` (`.name`) |
| `TARGET_BRANCH` | Default branch from `gh repo view` (`.defaultBranchRef.name`). Common values: `main`, `trunk`, `master`, `development`. If a project-level `CLAUDE.md` specifies a different target, prefer that. Ask the user to confirm if uncertain. |
| `PROJECT_NUMBER` | Optional. If `gh project list` returns exactly one project, suggest it. If it returns multiple, ask the user to pick or skip. If it returns none (or errors due to missing scope), skip the project board steps entirely. |

If `gh` is not authenticated or any auto-detection fails, ask the user to provide the missing values directly. Do not invent defaults.

---

## Step 1 — Ensure a Clean Working Tree

Check for uncommitted changes (staged + unstaged + untracked):

```bash
git status --porcelain
```

If there is output (uncommitted work exists):

1. Stage all relevant changes (`git add` specific files — avoid secrets like `.env`).
2. Create a commit using **conventional commit** format (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
3. Confirm the working tree is now clean.

If the tree is already clean, skip to Step 2.

---

## Step 2 — Fetch Latest and Diff Against Target Branch

```bash
git fetch origin "$TARGET_BRANCH"
```

Generate the full diff and a stat summary:

```bash
git diff "origin/$TARGET_BRANCH"...HEAD --stat
git diff "origin/$TARGET_BRANCH"...HEAD
git log "origin/$TARGET_BRANCH"...HEAD --oneline
```

If the diff is empty, abort and tell the user there are no changes to ship.

Use these outputs to understand **what changed** and **why**. This analysis drives the issue title, description, labels, and PR content in later steps.

---

## Step 3 — Infer Change Type and Confirm with User

Analyse the diff, commit messages, and current branch name to infer whether this is a **feature** (`feat`) or **bug fix** (`fix`).

**Inference heuristics (in priority order):**

1. Commit message prefixes: `feat:` / `fix:` / `bugfix:` / `hotfix:` etc.
2. Current branch name pattern: `feat/*`, `fix/*`, `hotfix/*`
3. Nature of the changes: new files/endpoints/capabilities = feature; patching existing logic = fix

Present the inferred type and ask the user to confirm or override:

> Based on the changes, this looks like a **feature** (or **fix**). Is that correct?

---

## Step 4 — Fetch Labels and Milestones from GitHub

Always refresh labels and milestones from the actual repo before applying. Run both in parallel:

```bash
gh label list --repo "$REPO_OWNER/$REPO_NAME" --limit 100 --json name,description
gh api "repos/$REPO_OWNER/$REPO_NAME/milestones" --jq '.[] | {number: .number, title: .title}'
```

Select the most appropriate labels based on the change type and affected areas (e.g. a `fix` change typically gets `bug`; a `feat` typically gets `enhancement` or a feature-area label that exists in the repo). **Only use labels that actually exist** in the repo — do not invent new ones.

If milestones exist, present them as a picker. If none exist, skip the milestone prompt entirely.

> Labels: `<label1>`, `<label2>`
> Milestone: which milestone applies?
>   1. <milestone title>
>   2. <milestone title>
>   …
>   (or press Enter to skip)

Capture the chosen milestone title (if any) — it will be applied to both the issue and the PR.

---

## Step 5 — Search for an Existing Issue

Derive 2–5 keywords from the diff and commit messages (e.g. `retry logic`, `auth middleware`).

```bash
gh issue list \
  --repo "$REPO_OWNER/$REPO_NAME" \
  --search "is:open <feature keywords>" \
  --limit 10 \
  --json number,title,url
```

If matches are found, present them to the user:

> Found open issue(s) matching "<feature keywords>":
> - #NNN — Title (URL)
>
> Use one of these, or create a new issue?

- If the user selects an existing issue → capture its number and **skip Step 6**.
- If no matches, or the user wants a new issue → proceed to Step 6.

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
```

Create the issue, including the milestone if one was selected in Step 4:

```bash
gh issue create \
  --repo "$REPO_OWNER/$REPO_NAME" \
  --title "<concise imperative title>" \
  --body "$(cat <<'EOF'
<issue body here>
EOF
)" \
  --label "<label1>,<label2>" \
  --milestone "<milestone title>"   # omit flag if user skipped
```

Capture the issue number from the output URL (e.g., `https://github.com/.../issues/NNN` -> `NNN`).

If an **existing issue** was selected in Step 5 and the user picked a milestone that the issue does not yet have, apply it now:

```bash
gh issue edit <NNN> --repo "$REPO_OWNER/$REPO_NAME" --milestone "<milestone title>"
```

---

## Step 7 — Add the Issue to the GitHub Project (Optional)

Skip this step if no `PROJECT_NUMBER` was resolved in Step 0.

```bash
gh project item-add "$PROJECT_NUMBER" \
  --owner "$REPO_OWNER" \
  --url "https://github.com/$REPO_OWNER/$REPO_NAME/issues/<NNN>"
```

If this fails with a scope error, prompt the user to run:

```bash
gh auth refresh -s read:project,project
```

…and then retry. If they decline, continue without the project board.

---

## Step 8 — Create and Push the Branch

Using the issue number and inferred type from Step 3:

```bash
# Create the new branch from the current HEAD
git checkout -b "<type>/<issue-number>"

# Push and set upstream
git push -u origin "<type>/<issue-number>"
```

Where `<type>` is `feat` or `fix` and `<issue-number>` is the number from Step 5/6.

**Note:** All commits from the current branch carry over since the new branch is created from HEAD.

If the branch already exists locally or remotely, ask the user whether to use an alternative name or reset. Do **not** force-push without explicit confirmation.

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
| CLI / scripts | `[ ] Run the command locally and verify expected output` |
| Docs / skills | `[ ] Render the doc / invoke the skill and verify behavior` |

Always include:
- `[ ] Smoke test passes locally`
- `[ ] No regressions in related features`

```bash
gh pr create \
  --repo "$REPO_OWNER/$REPO_NAME" \
  --base "$TARGET_BRANCH" \
  --head "<type>/<issue-number>" \
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

Omit `--milestone` if the user skipped milestone selection in Step 4.

**Critical:** The PR body MUST include `Closes #<issue-number>` so the issue auto-closes on merge.

---

## Step 10 — Add the PR to the GitHub Project (Optional)

Skip this step if no `PROJECT_NUMBER` was resolved in Step 0.

```bash
gh project item-add "$PROJECT_NUMBER" \
  --owner "$REPO_OWNER" \
  --url "https://github.com/$REPO_OWNER/$REPO_NAME/pull/<PR-number>"
```

Capture the PR number from the `gh pr create` output URL.

---

## Step 11 — Final Summary

Present a summary to the user:

```
Ship complete!

  Repo:   <REPO_OWNER>/<REPO_NAME>
  Base:   <TARGET_BRANCH>

  Issue:  #<NNN> — <title>
          https://github.com/<REPO_OWNER>/<REPO_NAME>/issues/<NNN>

  Branch: <type>/<NNN>

  PR:     #<PR-number> — <title>
          https://github.com/<REPO_OWNER>/<REPO_NAME>/pull/<PR-number>

  Milestone: <milestone title or "none">
  Project:   <Added to project #PROJECT_NUMBER | "skipped">

  Next steps:
  - Request reviewers on the PR if needed
```

---

## Error Handling

- **Missing `gh` scopes for projects** → prompt user to run `gh auth refresh -s read:project,project`, then retry. If declined, skip project board steps and continue.
- **Branch already exists** → ask the user for an alternative name or whether to delete the existing branch first. Never force-push without confirmation.
- **Empty diff vs target branch** → abort with a clear message; there is nothing to ship.
- **Auto-detection failed in Step 0** → ask the user for the missing value rather than guessing.
- **No labels/milestones in the repo** → skip those prompts; do not invent values.

---

## Usage Tips

- **Target branch override**: If the repo's default branch isn't the PR base you want (e.g., default is `main` but you ship to `development`), check the project's `CLAUDE.md` or ask the user before defaulting to the GitHub default branch.
- **Project board opt-out**: If the user doesn't use GitHub Projects, skip Steps 7 and 10 entirely — the rest of the workflow stands alone.
- **Custom labels**: Always pull labels live from the repo; never assume `bug`/`enhancement` exist.
- **Test checklists**: Extend the heuristics table in Step 9 with project-specific items in that project's local `CLAUDE.md` if the defaults aren't enough.
