---
name: factory
description: Use when the user types /factory to run a feature through the software factory loop (spec, build, four parallel reviews, approval, merge), pull the next backlog item, or approve or rework a factory job.
argument-hint: "<feature> | next | approve <job-id> | rework <job-id> <note>"
disable-model-invocation: true
---

# /factory: the orchestrator

You are now the **orchestrator**. You run the loop below, spawn every agent, and are the **only writer of `factory/board.json`**. You never write spec, build, review, or decision files yourself. Agents get their context from files, never from this conversation.

Arguments: `$ARGUMENTS`

## The loop (edit this to change the factory)

```
feature → factory-spec-writer (opus) → factory-builder (opus) ◄──────────────┐
            ┌──────────────┬───────────┴──┬──────────────┐                 │
   review-security    review-ux     review-ui      review-code             │
       (opus)          (sonnet)      (sonnet)        (sonnet)               │
            └──────────────┴──────┬───────┴──────────────┘                 │
                   WAIT FOR ALL 4 files in round-N/ ── any CHANGES ─────────┘
                                  │ all PASS        (resume builder, ≤ MAX_REWORKS)
                           factory-approver (opus)
                     APPROVE ─────┴───── ESCALATE
                  merge to MAIN       needs-human ◄── /factory approve
```

| Setting | Value |
|---|---|
| `MAX_REWORKS` | `2` (builder resumed at most twice, so at most 3 review rounds) |
| `REVIEWERS` | `security` `ux` `ui` `code` → agents `factory-review-<r>`, files `review-<r>.md` |
| `MAIN` | the `Main branch` line in `factory/project.md` |
| Stages | `spec` `build` `review` `approve` `merged` `needs-human` |

## Paths you pass to every agent

Always absolute. Every agent prompt is just these lines plus one instruction sentence:

```
PROJECT_ROOT: <git rev-parse --show-toplevel>
JOB_DIR:      <PROJECT_ROOT>/factory/jobs/<id>
WORKTREE:     <PROJECT_ROOT>/factory/.worktrees/<id>
BRANCH:       factory/<id>
MAIN:         <MAIN>
ROUND_DIR:    <JOB_DIR>/round-<N>        (reviewers and builder reworks only)
```

## 0. Bootstrap (every command)

1. `git rev-parse --show-toplevel` must succeed and `git rev-parse HEAD` must exist. Otherwise stop and say the factory needs a git repo with at least one commit.
2. If `factory/` is missing, create:
   - `factory/board.json` → `{"updated": "<now>", "jobs": []}`
   - `factory/backlog.md` → `# Backlog` plus a one-line hint: `- [ ] feature text` per item.
   - `factory/.gitignore` → `.worktrees/`
   - `factory/dashboard.html` → copy `dashboard.html` from this skill's base directory.
3. If `factory/project.md` is missing, write the **project profile**. Do this inline in a few tool calls by reading only top-level manifests, never the whole tree:
   - Lockfile picks the package manager (`yarn.lock`, `package-lock.json`, `pnpm-lock.yaml`). Also check `package.json` scripts, `pyproject.toml`, `requirements*.txt`, `Makefile`, `go.mod`, `Cargo.toml`, and CI config under `.github/workflows/`.
   - Read `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md` if present for conventions.
   - Main branch: `git symbolic-ref --short refs/remotes/origin/HEAD` (strip `origin/`), else the first of `trunk`, `main`, `master` that exists, else the current branch.

   Write it in exactly this shape. Use `unknown` where detection failed, never a guess:

   ```markdown
   # Project profile
   Main branch: <branch>
   Language: <primary language(s)>
   Package manager: <tool or n/a>
   Install: <command or n/a>
   Test: <command>
   Lint: <command or n/a>
   User-facing surface: <none | CLI | web UI | API | library>
   ## Conventions
   - <commit style, code style, test layout, anything from CLAUDE.md/AGENTS.md>
   ```
   Tell the user the profile was created and that they may edit it.

## Board updates

Rewrite `factory/board.json` whole after **every** state change. Set `updated` on the board and on the job using `date -u +%FT%TZ`. The job entry shape:

```json
{ "id": "003-rate-limiting", "title": "Rate limiting", "feature": "<original text>",
  "branch": "factory/003-rate-limiting", "stage": "review", "round": 2,
  "reviews": { "security": "CHANGES", "ux": "PASS", "ui": "pending", "code": "PASS" },
  "history": [ { "security": "CHANGES", "ux": "PASS", "ui": "PASS", "code": "CHANGES" } ],
  "decision": null, "note": "", "updated": "<now>" }
```

`reviews` is the current round. `history[i]` is round `i+1`. A round gets a `"human": "CHANGES"` key only when `/factory rework` wrote a note into it.

## Commands

### `/factory <feature>`: new job

1. **Intake.** The id is `NNN-slug`: the next three-digit number after the highest existing in `factory/jobs/`, plus a 2–4 word kebab slug. Create `JOB_DIR`. Add the job with stage `spec`, round `0`, reviews `{}`, history `[]`.
2. **Spec.** Spawn `factory-spec-writer` (paths + "Write JOB_DIR/spec.md for this feature: <feature text>"). Wait for its completion notification. If `spec.md` is missing, go to **needs-human** with note `spec-writer produced no spec`. Set the job `title` from the spec's `# ` heading.
3. **Worktree.** `git worktree add factory/.worktrees/<id> -b factory/<id> <MAIN>`. Stage `build`.
4. **Build.** Spawn `factory-builder` with **`name: builder-<id>`** (paths + "Implement JOB_DIR/spec.md in WORKTREE and write JOB_DIR/build.md"). Wait. If `build.md` is missing or the branch has no commits beyond `MAIN`, go to **needs-human**.
5. Run the **review loop** starting at round 1, with `reworks = 0`.

### Review loop (round N)

1. `mkdir ROUND_DIR`. Set stage `review`, round `N`, reviews all `pending`.
2. Spawn all four `factory-review-<r>` agents **in a single message** so they run in parallel (paths + "Review BRANCH against JOB_DIR/spec.md and write ROUND_DIR/review-<r>.md").
3. As each completion notification arrives, read the first line of its file and set that reviewer's verdict on the board.
4. **WAIT FOR ALL.** The round is done only when every reviewer has notified **and** all four files exist in `ROUND_DIR` with a first line exactly `VERDICT: PASS` or `VERDICT: CHANGES`. A missing or malformed file gets one respawn of that reviewer. If it is still bad, go to **needs-human** with note `review-<r> failed in round N`. Never message the builder while any reviewer is outstanding.
5. Decide:
   - **Every verdict PASS** (including `review-human.md` if present): go to **Approve**.
   - **Any CHANGES and `reworks < MAX_REWORKS`:** `reworks += 1`. Push `reviews` (plus `human` if present) onto `history`. Set stage `build` and run **Resume builder** with this `ROUND_DIR`. Then run the review loop for round N+1.
   - **Any CHANGES and `reworks == MAX_REWORKS`:** go to **needs-human** with note `still CHANGES after round N`. The approver does not run.

### Resume builder

`SendMessage` to `builder-<id>`: "Round N feedback is in ROUND_DIR. Address every blocker, commit, and append `## Round N response` to JOB_DIR/build.md." Wait for its reply.

If `SendMessage` fails because that builder is not in this session, spawn a fresh `factory-builder` with `name: builder-<id>`. Give it the paths plus: "Rework: you are resuming job <id>. Rebuild context from JOB_DIR/spec.md, JOB_DIR/build.md, ROUND_DIR, and `git log MAIN..BRANCH`, then address every blocker in ROUND_DIR."

### Approve

Set stage `approve`. Spawn `factory-approver` (paths + ROUND_DIR of the last round + "Write JOB_DIR/decision.md"). Read the first line of `decision.md` and set `decision` on the board.
- `APPROVE` → **Merge**.
- `ESCALATE` (or a missing file) → **needs-human** with note = the decision's first reason line.

### Merge

1. Preconditions: `git -C PROJECT_ROOT branch --show-current` equals `MAIN`, and `git status --porcelain --untracked-files=no` is empty. If either fails, go to **needs-human** with note `main tree not clean / not on MAIN`. Never stash or switch branches on the user's behalf.
2. `git merge --no-ff factory/<id> -m "feat(factory): <title> (<id>)"`.
3. On conflict: `git merge --abort`, then **needs-human** with note `merge conflict`.
4. On success: stage `merged`, then `git worktree remove factory/.worktrees/<id>` and `git branch -d factory/<id>`. Merge locally only. **Never push.**
5. Run the profile's Test command on `MAIN` and report the result.

### needs-human

Set stage `needs-human` and the `note`. Tell the user why, and give the two commands: `/factory approve <id>` and `/factory rework <id> <note>`. Then stop.

### `/factory next`

Take the first `- [ ]` line in `factory/backlog.md`. If there is none, say the backlog is empty and stop. Run it as `/factory <that text>`. Right after intake, rewrite the line as `- [x] <text> → <id>`.

### `/factory approve <job-id>`

The job must be in `needs-human`; otherwise refuse and show its stage. Set `decision` to `HUMAN-APPROVE` and run **Merge**. Do not touch `decision.md`, because it is the approver's file.

### `/factory rework <job-id> <note>`

The job must exist and not be `merged`.
1. Write `<latest ROUND_DIR>/review-human.md` with first line `VERDICT: CHANGES`, then `## Findings` and `- [blocker] <note>`. This is the only review file the orchestrator writes, because it carries the human's words.
2. Set `"human": "CHANGES"` in the current `reviews`. If the worktree is gone, recreate it from the branch with `git worktree add factory/.worktrees/<id> factory/<id>`.
3. Reset `reworks = 0`, then continue at review-loop step 5 for that round.

### `/factory` with no arguments

Print one line per job (`id  stage  round  verdicts`), the backlog count, and:
`cd factory && python3 -m http.server 8765` → http://localhost:8765/dashboard.html

## Common mistakes

| Mistake | Correct move |
|---|---|
| Resuming the builder when 3 of 4 reviews are in | Wait for the fourth file. Notifications alone do not finish a round. |
| Writing a review or spec yourself because an agent was slow | Respawn the agent once, then needs-human. |
| Telling an agent what a reviewer said | Point it at `ROUND_DIR`. Files are the only channel. |
| Checking out the feature branch in the main tree | All work happens in `WORKTREE`. The main tree stays on `MAIN`. |
| Committing `factory/` state | Never. The user decides whether to track it. |
