# Open PR Inventory — tylerfloyd/cortex

Tracking issue: #77 · Story 1: Inventory and order open PRs
Base of record: `main` @ `ca327601dc11e86f87b691f2d6f768b33e880101`
Inventory date: 2026-06-08 (UTC)

## Scope & method

Every open PR in `tylerfloyd/cortex` was inspected for its diff, changed files,
review status, CI checks, and dependencies. Repository instructions
(`CLAUDE.md`, `README.md`), package manifests, and CI configuration
(`.github/workflows/`, `.spec-drift.json`) were reviewed to establish the
required checks.

Open PRs at inventory time: #78, #76, #74, #73, #72, #71, #70.

- **PR #78** (`docs: commit approved plan for validating Cortex's open PRs`) is
  the plan-document commit owned by task #127 (already done). It is **out of
  scope** for this validation effort and is not inventoried below.
- PRs #76, #74, #73, #72, #71, #70 are the open PRs under validation and are
  inventoried below.

No PR is a draft. All are authored by `app/dependabot` (automated dependency
bumps) and target `main`.

## CI / required checks observed

Two checks run on each PR (from `.github/workflows/`):

- **`spec-drift / review`** — a reusable workflow from `tylerfloyd/spec-drift`
  that posts a review on the PR. `.spec-drift.json` sets `blockOnDrift: false`,
  so drift is advisory, not blocking. **Observed conclusion: `failure` on all
  six PRs** (no annotations returned; the bot's review body was empty at
  inventory time). This is the only check with a non-neutral conclusion.
- **`CodeQL`** — **observed conclusion: `neutral`** on all six PRs. GitHub
  reports "2 configurations present on `refs/heads/main` were not found"
  (`/language:actions`, `/language:javascript-typescript`), so CodeQL cannot
  determine introduced alerts. This is a **validation gap**, not a pass.

Because `spec-drift / review` is `failure` and `CodeQL` is `neutral`, every PR
currently reports `mergeable_state: blocked` (e.g. PR #76). No PR has a green
required check at inventory time.

## Overlapping / superseded changes

- **`app/package-lock.json`** is touched by **both PR #76 and PR #71**. Merging
  one first will make the other conflict on the lockfile; they must be merged
  in sequence (rebase the second after the first lands).
- **`mcp-server/package-lock.json`** is touched by **three PRs: #74, #72, and
  #70**. These three form a three-way lockfile overlap and must be merged in
  sequence, each rebased onto the updated `main` after the previous lands.
- **`discord-bot/package-lock.json`** is touched only by **PR #73** — no overlap.
- No PR is superseded by another; each bumps a distinct dependency (or set).
  The overlaps are lockfile-merge conflicts, not duplicate intent.

---

## PR 76 — build(deps): Bump next from 16.3.5 to 16.3.8 in /app

- **head_sha:** `82df27715699522c31684ab7521f72046707ad17`
- **branch:** `dependabot/npm_and_yarn/app/next-16.3.8` → `main`
- **purpose:** Bump the `next` framework dependency in the `/app` package from
  16.3.5 to 16.3.8 (patch/minor bump). Changes `app/package.json` and
  `app/package-lock.json` (2 files, +53/−553).
- **dependencies:** None on other open PRs for intent, but **shares
  `app/package-lock.json` with PR #71** — must be sequenced with it.
- **checks:** `spec-drift / review` = failure; `CodeQL` = neutral.
  `mergeable_state` = blocked.
- **disposition:** **Candidate — merge in the app batch, sequenced with PR #71.**
  Straightforward dependabot bump; no behavioral change expected. Blocked only
  by the advisory `spec-drift` failure and the lockfile overlap with #71.
  Resolve the #76/#71 lockfile ordering in Story 2, then validate in Story 3.

## PR 74 — build(deps): Bump ip-address and express-rate-limit in /mcp-server

- **head_sha:** `c2301e03d60fe68d6c53de69c78ed5ade4462051`
- **branch:** `dependabot/npm_and_yarn/mcp-server/multi-a1ac114ca3` → `main`
- **purpose:** Bump two dependencies in `/mcp-server` (`ip-address` and
  `express-rate-limit`). Changes `mcp-server/package-lock.json` only
  (1 file, +8/−7).
- **dependencies:** **Shares `mcp-server/package-lock.json` with PR #72 and
  PR #70** — three-way lockfile overlap; must be sequenced with both.
- **checks:** `spec-drift / review` = failure; `CodeQL` = neutral.
- **disposition:** **Candidate — merge in the mcp-server batch, sequenced with
  PR #72 and PR #70.** Straightforward dependabot bump. Blocked only by the
  advisory `spec-drift` failure and the three-way lockfile overlap.

## PR 73 — build(deps): Bump undici from 6.28.0 to 6.29.0 in /discord-bot

- **head_sha:** `e54d108ca79ddea9c3c3198ebf85923fd3cf0823`
- **branch:** `dependabot/npm_and_yarn/discord-bot/undici-6.29.0` → `main`
- **purpose:** Bump `undici` in `/discord-bot` from 6.28.0 to 6.29.0. Changes
  `discord-bot/package-lock.json` only (1 file, +3/−3).
- **dependencies:** **None** — `discord-bot/package-lock.json` is not touched by
  any other open PR. Fully independent.
- **checks:** `spec-drift / review` = failure; `CodeQL` = neutral.
- **disposition:** **Candidate — merge first (independent, no lockfile
  overlap).** Straightforward dependabot bump. Blocked only by the advisory
  `spec-drift` failure. Lowest-risk candidate in the inventory.

## PR 72 — build(deps): Bump qs from 6.15.3 to 6.16.0 in /mcp-server

- **head_sha:** `7d336a0ba82dd2f6b74e787c65245248c290595d`
- **branch:** `dependabot/npm_and_yarn/mcp-server/qs-6.16.0` → `main`
- **purpose:** Bump `qs` in `/mcp-server` from 6.15.3 to 6.16.0. Changes
  `mcp-server/package-lock.json` only (1 file, +3/−3).
- **dependencies:** **Shares `mcp-server/package-lock.json` with PR #74 and
  PR #70** — three-way lockfile overlap; must be sequenced with both.
- **checks:** `spec-drift / review` = failure; `CodeQL` = neutral.
- **disposition:** **Candidate — merge in the mcp-server batch, sequenced with
  PR #74 and PR #70.** Straightforward dependabot bump. Blocked only by the
  advisory `spec-drift` failure and the three-way lockfile overlap.

## PR 71 — build(deps): Bump @hono/node-server from 1.19.14 to 1.19.17 in /app

- **head_sha:** `88b7ec6b078345c8f09cdaa39399af3dd6a02068`
- **branch:** `dependabot/npm_and_yarn/app/hono/node-server-1.19.17` → `main`
- **purpose:** Bump `@hono/node-server` in `/app` from 1.19.14 to 1.19.17.
  Changes `app/package-lock.json` only (1 file, +3/−515).
- **dependencies:** **Shares `app/package-lock.json` with PR #76** — must be
  sequenced with it.
- **checks:** `spec-drift / review` = failure; `CodeQL` = neutral.
- **disposition:** **Candidate — merge in the app batch, sequenced with PR #76.**
  Straightforward dependabot bump. Blocked only by the advisory `spec-drift`
  failure and the lockfile overlap with #76.

## PR 70 — build(deps): Bump fast-uri from 3.1.0 to 3.1.8 in /mcp-server

- **head_sha:** `4e1c8bc1bc2806916b27612201f1daffe06e627a`
- **branch:** `dependabot/npm_and_yarn/mcp-server/fast-uri-3.1.8` → `main`
- **purpose:** Bump `fast-uri` in `/mcp-server` from 3.1.0 to 3.1.8. This is a
  **security release** (fixes multiple high/medium advisories: GHSA-hrr3-gc8f-f4qj,
  GHSA-qw65-cvwx-89v3, GHSA-58mr-gqgx-xq4g, and earlier). Changes
  `mcp-server/package-lock.json` only (1 file, +3/−3).
- **dependencies:** **Shares `mcp-server/package-lock.json` with PR #74 and
  PR #72** — three-way lockfile overlap; must be sequenced with both.
- **checks:** `spec-drift / review` = failure; `CodeQL` = neutral.
- **disposition:** **Candidate — merge in the mcp-server batch, sequenced with
  PR #74 and PR #72.** Security-relevant bump (priority within the batch).
  Blocked only by the advisory `spec-drift` failure and the three-way lockfile
  overlap.

---

## Proposed merge order

Ordered to minimize lockfile re-conflicts. Independent PRs first, then each
overlapping group merged in sequence (each later PR rebased onto updated
`main` after the previous lands):

1. **PR #73** (discord-bot/undici) — independent, no overlap. Merge first.
2. **App batch** (share `app/package-lock.json`): **PR #76** (next) → **PR #71**
   (@hono/node-server). Rebase #71 after #76 merges.
3. **mcp-server batch** (share `mcp-server/package-lock.json`): **PR #70**
   (fast-uri, security) → **PR #74** (ip-address/express-rate-limit) →
   **PR #72** (qs). Rebase each after the previous merges.

Within the mcp-server batch, PR #70 is ordered first because it is a security
release.

## Validation gaps (carried into Story 3)

- `spec-drift / review` is `failure` on all six PRs with no annotations and an
  empty bot review body. `.spec-drift.json` sets `blockOnDrift: false`, so this
  is advisory; the failure must be understood (or confirmed non-blocking) before
  recommending a merge.
- `CodeQL` is `neutral` on all six PRs because two code-scanning configurations
  on `main` (`/language:actions`, `/language:javascript-typescript`) were not
  found. CodeQL cannot determine introduced alerts — this is a gap, not a pass.
- Live CI results and PR state were read via the GitHub API at inventory time;
  they may change. Story 3 must re-verify checks in an isolated checkout.
