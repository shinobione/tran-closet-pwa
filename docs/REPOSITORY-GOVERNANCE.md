# Repository and deployment governance

This document defines how Trân Closet changes are authored, merged, generated and proven in GitHub.

## Authority

**main is authoritative.** Chat history, local branches, generated snapshots and deployment jobs are supporting evidence, not a replacement for the current `main` tree plus canonical project-state documents.

Engineering changes use pull requests. Product/runtime changes, CI architecture, Worker source, repository governance and documentation checkpoints are reviewed through short-lived branches and PR validation before merge. Squash merge is the project convention for engineering PRs so `main` keeps one intentional integration commit per slice/sub-slice.

Generated snapshots and generated system icons are a narrow exception described below. They are fallback/offline artifacts, not engineering releases.

## Current branch-protection state

Audited on 2026-08-19: GitHub reports `main` as **not protected** (`protected:false`). The repository also reports auto-merge disabled and update-branch disabled.

Slice 16.9 does **not** pretend that branch protection has been enabled. A strict “PR required for every write” rule would currently conflict with the two approved generated-main-write exceptions. Protection/rulesets should only be enabled after GitHub is configured with an explicit, audited bypass model for those automations, or after those generated writes are moved out of direct `main` commits.

Until then, repository CI and the generated-write helper provide guardrails, but they are not equivalent to server-side branch protection.

## Generated-main-write exceptions

Exactly two workflows may hold `contents: write` for repository commits:

1. `.github/workflows/sync-airtable.yml`
   - refreshes checked-in clothing/outfit snapshot fallbacks and cached item assets;
   - scheduled/manual generation is not a release boundary;
   - never edits application/Worker source or workflow files.
2. `.github/workflows/generate-brand-assets.yml`
   - regenerates committed favicon/PWA icon outputs from the repository-owned branding source;
   - does not own branding-source design decisions (Slice 16.10 owns source cleanup);
   - never edits workflow files at runtime.

Both writers use the repository-wide `generated-main-writes` concurrency group with `cancel-in-progress: false` and `scripts/commit-generated-artifacts.sh`.

The helper always:

- fetches the latest `origin/main`;
- resets the generated-write workspace to that exact main;
- regenerates outputs from the latest authoritative tree;
- stages only the configured generated-artifact allowlist;
- commits only when generated outputs actually differ;
- pushes with a normal fast-forward push, never `--force`;
- on a non-fast-forward race, fetches the new `main`, regenerates and retries;
- fails without changing `main` if convergence is not achieved within the bounded retry count.

A generated snapshot/icon commit does **not** mean a feature changed, a release was verified, or a prior engineering SHA was invalid. It is a descendant generated-artifact refresh.

## Workflow mutation rule

**Self-mutating workflows are forbidden.** A workflow must not add, edit or delete files under `.github/workflows/` in its own runtime commit.

Temporary migration/cleanup workflows, when unavoidable, must be created and removed through an explicit repository change path (connector/UI/PR-reviewed commit), and their runtime job must not try to delete itself. This avoids GitHub token workflow-permission failures, competing bot commits and ambiguous PR heads.

## Branch lifecycle

Short-lived engineering branches are disposable after their exact head has been proven integrated through a merged PR. The normal lifecycle is:

1. create from current `main`;
2. make one coherent engineering slice;
3. open PR and run the canonical validation topology;
4. merge only on the tested exact head;
5. delete the merged branch once GitHub confirms its current head matches a merged PR head;
6. never delete a branch with an open PR or with a current head that is not represented by a merged PR, unless a separately documented recovery decision proves the work obsolete.

Historical `noop-check*` branches are a special audited case: they may be deleted only when their current SHA exactly matches a known merged PR head.

Automatic post-merge deletion is desirable, but it must not be claimed as enabled unless the GitHub repository setting is explicitly verified. Slice 16.9 performs an audited cleanup of the current backlog instead of assuming that setting exists.

## CI ownership

The canonical PR-validation topology is documented in `docs/CI-COVERAGE.md` and guarded by `scripts/test-ci-topology.mjs`.

Repository-governance checks are part of existing validation rather than a new permanent workflow. They verify at minimum:

- the `contents: write` workflow allowlist;
- shared generated-write concurrency;
- use of the collision-safe helper;
- absence of direct/force pushes from generated workflows;
- absence of self-mutating workflow commands;
- presence of the governance vocabulary and branch-lifecycle contract.

## Deployment vocabulary

These states are deliberately separate:

- **MERGED** — the exact PR head passed required PR validation and the PR was integrated into `main`.
- **PAGES DEPLOYED** — GitHub Pages deployment evidence proves a `main` commit/descendant is being served; the app build card / `build-info.json` is the preferred exact proof.
- **WORKER DEPLOYED** — the Worker deployment workflow/health/read smoke proves the relevant Worker source is live. A merge of Worker source alone is not this state.
- **VERIFIED PROD** — requested real-product QA has passed against the deployed runtime, including device/cross-device checks required by the active closeout plan.

Do not collapse these into “done”. A green PR is not deployment proof; a deployment is not device QA; a scheduled snapshot descendant is not a new engineering release.

## Pages and Worker responsibilities

`deploy-pages.yml` is deployment-only. It validates the VERSION/cache contract, generates exact `build-info.json` from `VERSION` + git SHA, uploads and deploys the static PWA. It does not author product source.

`deploy-worker.yml` is deployment-only. It validates canonical taxonomy parity, deploys with Wrangler and verifies authenticated health plus canonical clothing/outfit reads. It does not commit to `main`.

If deployment evidence cannot be retrieved through the available GitHub integration, project state must say “deployment proof pending” rather than infer success from PR CI.

## Snapshot role

`js/airtable-snapshot.js`, `js/airtable-outfit-snapshot.js` and cached item assets are checked-in fallback/offline artifacts. Live canonical reads remain the preferred cross-device path where implemented.

Snapshot commits may legitimately move `main` beyond the most recent engineering merge SHA. Canonical project state should therefore record both the relevant runtime-changing merge and any later deployment/build SHA when proving production.

## Governance changes

Any future expansion of direct-main writers, bypass actors, branch rulesets, force-push permissions or deployment credentials is a governance change and must be explicit. The default is **no new exception**.
