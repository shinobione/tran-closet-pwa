# V0.5.16 · Slice 16.4 — Runtime consolidation

Status: implementation candidate on `v0.5.16-runtime-consolidation`.

## Goal

Replace the accumulated version-named runtime hotfix chain with clear canonical controllers while preserving the behavior proven during V0.5.8–V0.5.16 stabilization.

## Canonical runtime modules

- `app-refresh.js` — one external-data UI refresh adapter, replacing the temporary live Outfit bridge.
- `closet-search-core.mjs` + `closet-search.js` — accent-insensitive VI/FR search that filters cards in place, so typing does not destroy/recreate the search field.
- `photo-picker.js` — explicit Camera + Gallery choices; the gallery input does not carry `capture`, while the dedicated camera input does.
- `manual-sync.js` — one manual sync controller for clothing + Outfit queues; no full browser reload on success.
- `i18n-runtime-compat.js` — one transitional dynamic compatibility layer replacing the V0.5.9/Profile/AI/Assistant translation hotfix stack. Slice 16.5 replaces this with key-based render-time translations.

## Removed historical runtime files

- `js/v0512-sync-hotfix.js`
- `js/v059-ux-fixes.js`
- `js/v0510-search.js`
- `js/photo-picker-mobile.js`
- `js/i18n-v059-hotfix.js`
- `js/i18n-v0510-profile.js`
- `js/i18n-v0513-ai.js`
- `js/assistant-ui-hotfix.js`
- `js/live-outfit-ui-bridge.js`

The old CI workflow names remain temporarily for historical regression coverage, but their assertions now point at the canonical modules. Workflow consolidation itself remains Slice 16.7.

## Observer topology

The search and photo controllers observe only top-level route replacement (`childList:true`) and do not use subtree observers. The transitional i18n compatibility layer keeps exactly one subtree child-list observer because some assistant/share text is inserted dynamically below the route root; it ignores `characterData` and attributes so its own text replacements cannot recursively trigger itself.

## Validation

`scripts/test-runtime-consolidation.mjs` protects bilingual/accent-insensitive search behavior. `validate-v0516-runtime-consolidation.yml` additionally rejects resurrection of the removed runtime files, checks camera/gallery semantics, confirms clothing + Outfit manual sync, forbids `location.reload()` in the canonical manual sync path, and checks offline app-shell wiring.

Formal production/browser verification remains separate from PR CI.
