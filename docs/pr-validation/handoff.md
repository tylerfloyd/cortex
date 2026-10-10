# Handoff to Boyd — merge order & validation of Cortex's open PRs

Tracking issue: #77 · Story 4: Hand off merge order and validate subsequent batches
Repo: `tylerfloyd/cortex`
Base of record: `main` @ `ca327601dc11e86f87b691f2d6f768b33e880101`
Handoff date: 2026-10-10 (UTC)

## Bottom line

**None of the six open PRs is ready to merge right now.** Every one is
`blocked` (see below). The dependency-ordered list below is the recommended
merge sequence *once the blockers clear*; it is handed to you so you can merge
a batch, and so the remaining candidates can be re-validated against the new
`main`.

Two distinct blocker classes apply:

1. **All six PRs** — `reviewDecision: REVIEW_REQUIRED` (no approving review),
   which is the actual `mergeStateStatus: BLOCKED` condition. In addition, the
   required `spec-drift / review` check is `failure` on all six with **no
   available failure log** (diagnostic unavailable), and `CodeQL` is
   `skipped`/`neutral` on all six because two code-scanning configurations on
   `main` (`/language:actions`, `/language:javascript-typescript`) were not
   found. Per `.spec-drift.json` (`blockOnDrift: false`) the spec-drift failure
   is advisory, but it is still a required CI check that did not pass, and
   CodeQL produced no scan result — so neither is a clean pass.
2. **PR 76 and PR 71 only** — their `app/package-lock.json` is **out of sync
   with `app/package.json`**: `npm ci` fails on the PR head (missing
   `esbuild@0.28.2` and its platform packages) while it passes on base
   `ca32760`. The PR diff removes the nested `vitest/node_modules/@esbuild/*`
   lock entries. TypeScript/Vitest/build checks could not be run because the
   install failed. These two must have their lockfile corrected before they can
   merge.

No merge conflict exists on any PR (Story 2: all six `no_conflict`, all
`MERGEABLE`). The blockers are approval + CI/lockfile, not conflicts.

## dependency_order

Recommended merge sequence, ordered to minimize lockfile re-conflicts
(independent PR first, then each overlapping lockfile group merged in sequence,
each later PR rebased onto the updated `main` after the previous lands):

1. **PR 73** — `discord-bot/undici` 6.28.0 → 6.29.0. Independent; no lockfile
   overlap with any other PR. Merge first.
2. **PR 76** — `app/next` 16.3.5 → 16.3.8. First of the `app` batch.
3. **PR 71** — `app/@hono/node-server` 1.19.14 → 1.19.17. Second of the `app`
   batch (shares `app/package-lock.json` with PR 76); rebase after PR 76 lands.
4. **PR 70** — `mcp-server/fast-uri` 3.1.0 → 3.1.8. First of the `mcp-server`
   batch; ordered first because it is a **security release** (fixes
   GHSA-hrr3-gc8f-f4qj, GHSA-qw65-cvwx-89v3, GHSA-58mr-gqgx-xq4g, and earlier).
5. **PR 74** — `mcp-server/ip-address` + `express-rate-limit`. Second of the
   `mcp-server` batch (shares `mcp-server/package-lock.json` with PR 70 and
   PR 72); rebase after PR 70 lands.
6. **PR 72** — `mcp-server/qs` 6.15.3 → 6.16.0. Third of the `mcp-server`
   batch; rebase after PR 74 lands.

Lockfile overlap map: `app/package-lock.json` = {PR 76, PR 71};
`mcp-server/package-lock.json` = {PR 70, PR 74, PR 72};
`discord-bot/package-lock.json` = {PR 73} (no overlap).

## Per-PR findings

### PR 73 — `discord-bot/undici` 6.28.0 → 6.29.0
- head_sha: `e54d108ca79ddea9c3c3198ebf85923fd3cf0823`
- conflict: `no_conflict` (MERGEABLE; test merge clean).
- validation: **gap**. Local checks pass (`git diff --check`, `npm ci`,
  `npm run build` in `/discord-bot`). Required CI: `spec-drift / review`
  failure (no log), `CodeQL` skipped.
- blocked: yes — `REVIEW_REQUIRED` (no approving review) + spec-drift failure
  without diagnostic + CodeQL no result. Lowest-risk candidate; no lockfile
  overlap.

### PR 76 — `app/next` 16.3.5 → 16.3.8
- head_sha: `82df27715699522c31684ab7521f72046707ad17`
- conflict: `no_conflict` (MERGEABLE).
- validation: **gap**. `git diff --check` passes, but `npm ci` in `/app`
  **fails** on the PR head (lockfile out of sync; missing `esbuild@0.28.2` and
  platform packages) while it passes on base. tsc/Vitest/build not run.
  Required CI: `spec-drift / review` failure (no log), `CodeQL` skipped.
- blocked: yes — `REVIEW_REQUIRED` + **out-of-sync `app/package-lock.json`
  (must be fixed)** + spec-drift failure without diagnostic + CodeQL no result.
  Shares `app/package-lock.json` with PR 71 — sequence with it.

### PR 71 — `app/@hono/node-server` 1.19.14 → 1.19.17
- head_sha: `88b7ec6b078345c8f09cdaa39399af3dd6a02068`
- conflict: `no_conflict` (MERGEABLE; the `@esbuild` deletions are part of the
  PR's own diff, not a divergence from `main`).
- validation: **gap**. `git diff --check` passes, but `npm ci` in `/app`
  **fails** on the PR head (same out-of-sync lockfile as PR 76; missing
  `esbuild@0.28.2`/platform packages) while it passes on base. tsc/Vitest/build
  not run. Required CI: `spec-drift / review` failure (no log), `CodeQL`
  skipped.
- blocked: yes — `REVIEW_REQUIRED` + **out-of-sync `app/package-lock.json`
  (must be fixed)** + spec-drift failure without diagnostic + CodeQL no result.
  Shares `app/package-lock.json` with PR 76 — rebase after PR 76 lands.

### PR 70 — `mcp-server/fast-uri` 3.1.0 → 3.1.8 (security release)
- head_sha: `4e1c8bc1bc2806916b27612201f1daffe06e627a`
- conflict: `no_conflict` (MERGEABLE).
- validation: **gap**. Local checks pass (`git diff --check`, `npm ci`,
  `npm run build`; `fast-uri` resolves to 3.1.8; no test script in
  `mcp-server`). Required CI: `spec-drift / review` failure (no log), `CodeQL`
  skipped.
- blocked: yes — `REVIEW_REQUIRED` + spec-drift failure without diagnostic +
  CodeQL no result. Security-relevant; ordered first in the `mcp-server` batch.
  Shares `mcp-server/package-lock.json` with PR 74 and PR 72.

### PR 74 — `mcp-server/ip-address` + `express-rate-limit`
- head_sha: `c2301e03d60fe68d6c53de69c78ed5ade4462051`
- conflict: `no_conflict` (MERGEABLE).
- validation: **gap**. Local checks pass (`git diff --check`, `npm ci`,
  `npm run build`). Required CI: `spec-drift / review` failure (no log),
  `CodeQL` skipped.
- blocked: yes — `REVIEW_REQUIRED` + spec-drift failure without diagnostic +
  CodeQL no result. Shares `mcp-server/package-lock.json` with PR 70 and
  PR 72 — rebase after PR 70 lands.

### PR 72 — `mcp-server/qs` 6.15.3 → 6.16.0
- head_sha: `7d336a0ba82dd2f6b74e787c65245248c290595d`
- conflict: `no_conflict` (MERGEABLE).
- validation: **gap**. Local checks pass (`git diff --check`, `npm ci`,
  `npm run build`; `qs` resolves to 6.16.0; `qs` is a transitive dep; no test
  script in `mcp-server`). Required CI: `spec-drift / review` failure (no
  log), `CodeQL` skipped.
- blocked: yes — `REVIEW_REQUIRED` + spec-drift failure without diagnostic +
  CodeQL no result. Shares `mcp-server/package-lock.json` with PR 70 and
  PR 74 — rebase after PR 74 lands.

## blocked

Every inventoried PR is currently left open with a concrete blocker (none is
merged by you yet):

- **PR 73, PR 70, PR 74, PR 72** — blocked on: (a) required approving review
  (`REVIEW_REQUIRED`); (b) `spec-drift / review` failing with no available
  diagnostic; (c) `CodeQL` producing no scan result (missing configs on
  `main`). Local checks pass for all four.
- **PR 76, PR 71** — blocked on the above **plus** an out-of-sync
  `app/package-lock.json` that makes `npm ci` fail on the PR head; the lockfile
  must be corrected (and tsc/Vitest/build re-run) before these two can merge.

## refresh

Recommendations in this handoff are tied to the recorded base
(`main` @ `ca32760`) and to each PR's tested head SHA. **Refresh them whenever
a tested PR or the base changes:**

- After you merge a batch, fetch the updated `main` and re-run the conflict
  checks and validation for the remaining candidates (rebase each remaining PR
  onto the new `main`, then re-check `git diff --check`, the package
  install/build, and `gh pr checks`).
- Re-validate PR 76 and PR 71 specifically once their `app/package-lock.json`
  is corrected, and confirm the `spec-drift` failure is understood (or
  confirmed non-blocking) and CodeQL yields a usable result before
  recommending any merge.
- Never treat a skipped check (CodeQL) or a check with no diagnostic
  (spec-drift) as a pass.

## Out of scope (per approved plan)
Merging on your behalf, behavioral fixes, substantial rewrites, ambiguous
conflict resolutions, deployments, production migrations, closing PRs, changing
branch protections, or bypassing required checks.
