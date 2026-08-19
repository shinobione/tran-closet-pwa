# CI coverage map

Canonical validation topology after V0.5.16 Slice 16.7.

## Pull-request validation workflows

| Workflow | Primary contract |
| --- | --- |
| `validate.yml` | Broad PWA shell, syntax, focused unit tests, Smart Tags, Daily Assistant, keyed i18n, secrets guard |
| `validate-ui-profile-contracts.yml` | Mobile live wiring, Camera/Gallery, search stability, color taxonomy, fine-color Worker, Profile/build diagnostics, French legacy coverage, CI topology |
| `validate-sync-delete-contracts.yml` | Manual sync, clothing + Outfit flush behavior, delete reconciliation semantics, canonical reread, CORS-safe no-store behavior |
| `validate-v0516-browser-smoke.yml` | Real Chromium boot/routes/search/Add/Profile/Outfits/Daily Assistant and FR↔VI crash smoke with external network stubs |
| `validate-v0516-keyed-i18n.yml` | Keyed translation catalog and migrated dynamic-surface contracts |
| `validate-v0516-outfit-integrity.yml` | Incomplete Outfit invariant and non-destructive UI/recommendation behavior |
| `validate-v0516-outfit-live-sync.yml` | Live `/v1/outfits` reconciliation, pending/tombstone protection and UI convergence contract |
| `validate-v0516-runtime-consolidation.yml` | Canonical runtime controllers and rejection of retired hotfix files/imports |
| `validate-v0516-version-cache.yml` | VERSION-driven refs, exact build cache identity, app-shell coherence and Pages deployment proof |

`pwa-isolation.yml` was retired because `scripts/test-pwa-isolation.mjs` is already executed by both `validate.yml` and the version/cache gate.

## Historical workflows absorbed in Slice 16.7

The following files must not return. Their unique checks are preserved in the two consolidated domain suites above:

- `validate-v058.yml` → UI/Profile contracts
- `validate-v059.yml` → UI/Profile contracts
- `validate-v0510.yml` → UI/Profile contracts
- `validate-v0513.yml` → UI/Profile contracts
- `validate-v0512.yml` → Sync/Delete contracts
- `validate-v0514.yml` → Sync/Delete contracts
- `validate-v0515.yml` → Sync/Delete contracts
- `pwa-isolation.yml` → already covered twice by current suites

`scripts/test-ci-topology.mjs` enforces this topology so retired version-specific gates cannot silently reappear and required domain validators cannot disappear.

## Browser smoke policy

The browser smoke uses a fresh Chromium context and local static server. It intentionally blocks Service Worker use inside the smoke because cache identity has its own dedicated tests; the purpose here is to catch runtime/render crashes directly.

External dependencies are deterministic:

- `build-info.json` is stubbed with a fake local build stamp;
- Open-Meteo forecast/geocoding are stubbed;
- the sync Worker is stubbed and no device sync token is configured;
- the smoke never clicks a save/sync mutation action.

A smoke failure is triggered by uncaught page exceptions, failed local script/style requests, or a failed product-route assertion.

## Deployment and scheduled workflows

Deployment/snapshot/asset-generation workflows are not part of the PR-validation-count consolidation and remain separately governed:

- `deploy-pages.yml`
- `deploy-worker.yml`
- `sync-airtable.yml`
- `generate-brand-assets.yml`

Pages still runs the VERSION/cache preflight before producing the exact `build-info.json` stamp.
