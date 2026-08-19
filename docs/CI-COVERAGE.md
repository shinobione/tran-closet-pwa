# CI coverage map

Canonical validation topology after V0.5.16 Slice 16.7, with taxonomy ownership clarified in Slice 16.8 and branding-source ownership clarified in Slice 16.10.

## Pull-request validation workflows

| Workflow | Primary contract |
| --- | --- |
| `validate.yml` | Broad PWA shell, syntax, focused unit tests, canonical taxonomy parity, Smart Tags, Daily Assistant, keyed i18n, secrets guard |
| `validate-ui-profile-contracts.yml` | Mobile live wiring, Camera/Gallery, search stability, canonical taxonomy/fine-color Worker parity, canonical branding-source guard, Profile/build diagnostics, French legacy coverage, CI topology |
| `validate-sync-delete-contracts.yml` | Manual sync, clothing + Outfit flush behavior, delete reconciliation semantics, canonical reread, CORS-safe no-store behavior |
| `validate-v0516-browser-smoke.yml` | Real Chromium boot/routes/search/Add/Profile/Outfits/Daily Assistant, canonical branding wiring and FR↔VI crash smoke with external network stubs |
| `validate-v0516-keyed-i18n.yml` | Keyed translation catalog and migrated dynamic-surface contracts |
| `validate-v0516-outfit-integrity.yml` | Incomplete Outfit invariant and non-destructive UI/recommendation behavior |
| `validate-v0516-outfit-live-sync.yml` | Live `/v1/outfits` reconciliation, pending/tombstone protection and UI convergence contract |
| `validate-v0516-runtime-consolidation.yml` | Canonical runtime controllers and rejection of retired hotfix files/imports |
| `validate-v0516-version-cache.yml` | VERSION-driven refs, exact build cache identity, app-shell coherence and Pages deployment proof |

`pwa-isolation.yml` was retired because `scripts/test-pwa-isolation.mjs` is already executed by both `validate.yml` and the version/cache gate.

## Canonical taxonomy coverage

Slice 16.8 keeps taxonomy parity inside the existing nine-workflow topology rather than adding another PR workflow.

- `shared/taxonomy.json` is the source of truth for categories, colors, styles, tags and VI/FR labels.
- `scripts/generate-taxonomy.mjs` deterministically generates both client and Worker modules and fails on drift.
- `scripts/test-taxonomy.mjs` verifies client/Worker equality, label completeness, Airtable category alias round-trip and Daily Assistant semantic-subset membership.
- `validate.yml` runs generation drift + taxonomy tests as part of broad product validation.
- `validate-ui-profile-contracts.yml` owns the Worker/fine-color integration checks against the generated taxonomy.
- `deploy-worker.yml` runs taxonomy parity before any Worker deployment and is triggered when the canonical taxonomy source or generator/tests change.

The historical Airtable storage value `Swimware ` remains an explicit compatibility alias for canonical runtime value `Swimware`; this is compatibility behavior, not a data migration.

## Canonical branding coverage

Slice 16.10 keeps branding protection inside existing validation ownership plus the dedicated asset generator.

- `docs/BRANDING-SOURCES.md` defines the four approved visual masters and their exact Git blob locks.
- `scripts/test-branding-sources.mjs --strict` requires exactly those four files under `branding/`, byte-locks them, verifies runtime/Service Worker/generator wiring and rejects references to retired source names.
- `validate-ui-profile-contracts.yml` owns the permanent strict source guard.
- `validate-v0516-browser-smoke.yml` verifies the canonical header actually loads, the hero uses the canonical logo mark and the iOS splash remains wired.
- `generate-brand-assets.yml` uses Python 3.12 + Pillow 12.3.0, regenerates favicon/PWA outputs from the exact approved favicon source and requires zero generated-output diff on pull requests.

Passing these guards proves canonical source bytes, deterministic icon outputs and browser wiring are unchanged; it does not replace installed-device cache/visual QA in Slice 16.11.

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

Pages still runs the VERSION/cache preflight before producing the exact `build-info.json` stamp. Worker deploy additionally runs canonical taxonomy parity before Wrangler deployment. Branding generation additionally enforces the strict canonical-source contract and zero-diff generated outputs on pull requests.
