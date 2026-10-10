# Validate Cortex's open PRs

## Goal
Review every open PR in `tylerfloyd/cortex`, fix straightforward conflicts, and give Boyd a validated merge order with concrete findings for anything blocked.

## Target
Repo: tylerfloyd/cortex

## Stories
1. Inventory and order the PRs — Inspect repository instructions, package scripts, CI configuration, and every open PR's diff, review status, checks, and dependencies. Include drafts in the inventory and identify overlapping or superseded changes. Acceptance: every open PR has a recorded head SHA, purpose, dependencies, and proposed disposition.

2. Fix straightforward conflicts — Resolve conflicts on the existing PR branches where both changes' intended behavior can be preserved unambiguously. Acceptance: each fix is pushed to its original PR and reviewed; ambiguous conflicts, behavioral defects, substantial rewrites, and risky migrations remain blocked with specific findings.

3. Validate the first mergeable batch — Review correctness, regressions, security implications, and relevant tests. Test each candidate combined with current `main` in an isolated checkout, using disposable services and data where needed. Acceptance: every recommended PR has passing applicable local checks and required CI, with its tested PR and base SHAs recorded. Missing checks or unavailable infrastructure are reported as validation gaps.

4. Hand off merges and validate subsequent batches — Give Boyd a dependency-ordered list of ready PRs, findings, and blocked PRs. After Boyd merges a batch, fetch updated `main` and repeat conflict checks and validation for remaining candidates. Acceptance: every inventoried PR is either merged by Boyd or left open with a concrete blocker; recommendations are refreshed whenever a tested PR or base changes.

## Verify
Run from the repository root in each candidate's isolated integration checkout. First inspect package manifests and repository instructions to establish additional required checks.

``` bash
git diff --check origin/main...HEAD

(cd app && npm ci && npx --no-install tsc --noEmit && npx --no-install vitest run && npm run build)

(cd discord-bot && npm ci && npm run build)

(cd mcp-server && npm ci && npm run build)

gh pr checks --repo tylerfloyd/cortex
```

The final command runs from the corresponding PR branch and checks its GitHub status. Record required checks separately from optional checks.

Run repository-prescribed lint, integration tests, and relevant smoke checks as well, including browser-extension checks when affected. Inspect the final conflict-resolution diff directly; compilation alone does not verify preserved behavior.

These baseline commands have not been executed or checked against the package manifests in this thread. Missing tooling, unsupported commands, unavailable services, or absent CI must be resolved or explicitly reported before recommending a merge. Never represent skipped validation as passing.

## Out of scope
- Merging PRs on Boyd's behalf.
- Behavioral fixes, substantial rewrites, or ambiguous conflict resolutions.
- Deployments, production migrations, or tests against production data.
- Closing PRs, changing branch protections, or bypassing required checks.

## Risks
- Live PR state and CI results have not been verified here.
- PRs that pass independently may fail together; recommendations depend on the recorded base SHA.
- Some checks may require credentials or disposable PostgreSQL and Redis services.
- Fork permissions may prevent pushing conflict fixes; report affected PRs.

## Open questions
None about the agreed scope. Discoveries requiring broader changes return to Boyd for a decision.
