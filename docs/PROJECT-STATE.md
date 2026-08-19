# PROJECT STATE — Trân's Closet PWA

> **Read this file first in every new work session, then read [`ROADMAP.md`](./ROADMAP.md).**
>
> This file records the current factual checkpoint. If chat history disagrees with the repository, re-verify `main` and follow the repository.

Last state update: **2026-08-19**

---

## Canonical checkpoint

- repository: `shinobione/tran-closet-pwa`
- canonical branch: `main`
- version file: **`v0.5.16`**
- current runtime-changing main SHA: **`082487fc938bbbed47e37a00727a23989a58a99b`** — Slice 16.4 runtime consolidation
- PWA: `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker: `https://tran-closet-sync.jerryquinet.workers.dev`
- IndexedDB: `tran-closet`, schema version **4**
- Worker entrypoint configured by `worker/wrangler.toml`: `src/v059.js`

Important recent runtime lineage:
- Slice 16.2 initial live Outfit parity: PR **#49**, merge/runtime **`183a2650f1cfe95320bb6fde9c3d9768ea31f07c`**;
- Slice 16.2 visible UI convergence follow-up: PR **#50**, merge **`6ed2bcd345fcaf8c98ba03abdad9ad876ee6a21f`**;
- Slice 16.3 incomplete Outfit integrity: PR **#51**, squash merge **`f3cf862d94c7186773a35f0fca511838d68bd5d8`**;
- Slice 16.4 runtime consolidation: PR **#52**, squash merge **`082487fc938bbbed47e37a00727a23989a58a99b`** after **12/12 PR workflows SUCCESS**.

**Do not infer deployment from merge.** Post-merge Pages/Worker state must still be independently proven when a claim depends on deployment. The available GitHub connector is reliable for PR-triggered CI but does not consistently expose all push-triggered deployment runs.

### Last known clean real-device data baseline

The last clean diagnostic baseline remains:
- clothing items: **11**;
- outfits: **2**;
- pending clothing mutations: **0**;
- pending Outfit mutations: **0**;
- orphaned local clothing creates: **0**;
- orphaned local Outfits: **0**;
- clothing flush: `ok: true`, `pending: 0`, `repaired: 0`;
- Outfit flush: `ok: true`, `pending: 0`, `repaired: 0`;
- all audited clothing records had Airtable IDs and synced state;
- both audited Outfits had Airtable records and no pending queue entry.

The stale clothing DELETE reconciliation bug targeting `rec6sAxfNivkTmiMp` remains **closed in v0.5.15+**.

---

## Phase / slice status

- **V0.1 — Local Closet:** ✅ CLOSED
- **V0.2 — Airtable Bridge:** ✅ CLOSED / VERIFIED PROD
- **V0.3 — Outfits:** ✅ CLOSED / VERIFIED PROD
- **V0.4 — Smart Closet:** ✅ CLOSED / VERIFIED PROD
- **V0.5-A — Daily Assistant:** 🟢 operational; overall V0.5 remains open
- **V0.5.16 — Consolidation & Hardening:** 🔵 ACTIVE
  - **16.0 canonical docs / continuation:** ✅ CLOSED
  - **16.1 GitHub hygiene:** ✅ CLOSED
  - **16.2 live Outfit sync parity:** 🟡 ENGINEERING MERGED; strict two-device VERIFIED-PROD proof not recorded. User elected to continue consolidation; final cross-device verification is carried into Slice 16.11.
  - **16.3 incomplete Outfit integrity:** 🟡 MERGED / CI GREEN; production UI QA deferred to Slice 16.11.
  - **16.4 runtime consolidation:** 🟡 MERGED / 12/12 CI GREEN; browser/device regression QA deferred to Slice 16.11.
  - **16.5 i18n architecture cleanup:** 🔵 NEXT ACTIVE ENGINEERING SLICE
- **V0.5-B — Wear history & rotation:** ⏭ blocked until V0.5.16 closeout

Canonical principle:

> **IA and heuristics propose; Trân decides before any canonical or destructive write.**

---

## Session recovery contract

Every new ChatGPT/Codex window must recover state from the repository in this order:

1. `VERSION`
2. `docs/PROJECT-STATE.md`
3. `docs/ROADMAP.md`
4. current `main` SHA
5. open PRs / active branch
6. relevant CI / Pages / Worker state if deployment matters

Do **not** reconstruct status from an earlier chat reply when these sources are available.

---

## What is working / merged now

### Clothing cloud sync

- local-first IndexedDB CRUD;
- secured Worker write path;
- separate mutation queue;
- idempotent Airtable create/update/delete;
- delete tombstones / anti-resurrection;
- canonical snapshot fallback;
- live canonical clothing reread through the Worker;
- visible/online polling;
- pending-local-mutation protection;
- CORS-safe stale DELETE reconciliation.

### Outfit cloud sync — Slice 16.2

Merged architecture now includes:
- authenticated Worker `GET /v1/outfits`;
- live canonical hydration and roughly 30-second visible polling;
- pending Outfit mutation protection;
- cloud delete propagation;
- tombstone / pending-delete anti-resurrection;
- diagnostics for live Outfit count / timestamp / error;
- focus + pageshow foreground checks;
- UI convergence through `tran:outfits-live-changed` without `location.reload()`;
- behavior tests for remote create/update/delete, pending edit/delete and tombstones.

Real QA before PR #50 proved the cloud/read path worked but the UI did not update automatically; PR #50 fixed that UI boundary. A strict post-#50 two-device create/update/delete proof was not recorded before the user asked to continue, so final verification remains part of 16.11.

### Outfit integrity — Slice 16.3

Merged behavior:
- `outfitIntegrity()` derives complete/incomplete from **resolved** linked clothing count;
- fewer than 2 resolved clothing items => `incomplete`;
- detection does **not** write/delete/repair canonical data;
- incomplete Outfits remain visible and editable/deletable;
- FR/VI warning and resolved-item count are shown;
- share-ready Lookbook presentation is suppressed until repaired;
- incomplete saved Outfits are excluded from Daily Assistant ranking as complete looks;
- tests include the important case where a one-piece garment is wearable but a one-item saved Outfit is still invalid under the product invariant ≥2.

The known real lifecycle example remains **`Lookbook Test`**, which previously had only `Melody Bag` linked.

### Runtime consolidation — Slice 16.4

PR #52 replaced the version-named hotfix chain with canonical runtime controllers:
- `app-refresh.js` — external canonical-data refresh adapter;
- `closet-search-core.mjs` + `closet-search.js` — accent-insensitive VI/FR in-place search;
- `photo-picker.js` — explicit Camera + Gallery source picker;
- `manual-sync.js` — clothing + Outfit manual queue flush, no browser reload;
- `i18n-runtime-compat.js` — one transitional compatibility layer until Slice 16.5.

Physically removed historical runtime files:
- `v0512-sync-hotfix.js`;
- `v059-ux-fixes.js`;
- `v0510-search.js`;
- `photo-picker-mobile.js`;
- `i18n-v059-hotfix.js`;
- `i18n-v0510-profile.js`;
- `i18n-v0513-ai.js`;
- `assistant-ui-hotfix.js`;
- `live-outfit-ui-bridge.js`.

Search and photo controllers no longer use subtree observers. The transitional i18n compatibility layer intentionally keeps one child-list subtree observer for dynamically inserted assistant/share copy; it ignores character-data/attribute changes so its own text replacements do not recursively trigger itself. Slice 16.5 owns removing mutation-based translation entirely.

Historical workflow filenames remain temporarily, but their checks now point at the canonical runtime modules. Full workflow consolidation remains Slice 16.7.

### Smart Closet / Daily Assistant

Still present:
- real Workers AI vision pipeline;
- multi-pass/retry behavior;
- enriched categories/colors/tags;
- Duplicate Guard;
- human validation before applying AI suggestions;
- weather/occasion-aware Daily Assistant;
- explicit save only;
- incomplete saved Outfits excluded from complete-look ranking after Slice 16.3.

### Build identification

Pages generates `build-info.json` from the exact deployed SHA and `VERSION`. Profile uses it as deployment identification. Preserve this mechanism.

---

## Current technical debt / blockers

### 16.5 — i18n architecture

Current translation is still fundamentally DOM-text replacement. Slice 16.4 reduced the number of compatibility layers, but `i18n.js` still has a body-wide mutation translator and `i18n-runtime-compat.js` is explicitly transitional.

Target for 16.5:
- translation keys with parameters at render time;
- Vietnamese default preserved;
- persistent FR QA mode preserved;
- dynamic messages translated by key, not observed text;
- remove `i18n-runtime-compat.js` and mutation-based translation when covered surfaces are migrated.

### 16.6 — PWA cache/version debt

Service Worker cache namespace is still historically `tran-closet-v0.5.1` and app-shell URLs contain mixed query versions. `VERSION`/build metadata must become the single source of cache/version identity.

### 16.7 — CI fossilization / browser smoke

Many workflow names remain version-specific even though several were retargeted in 16.4. Static guards did not catch previous browser-only Profile failures. Consolidate the workflows and add a real browser smoke.

### 16.8 — taxonomy drift

Category/color/style/tag definitions still exist in multiple client, Worker and Airtable layers.

### 16.9 — repo / deployment governance

- `main` is not protected;
- snapshot/asset workflows can write to `main`;
- short-lived merged engineering branches are not automatically deleted by the available connector;
- two accidental no-op branches, `noop-check` and `noop-check-2`, were created during connector work and contain no canonical work. They must be removed during governance/branch cleanup rather than treated as project state.

`main` is always authoritative.

### 16.10 — branding source clutter

Current visual identity is correct; old/current branding sources still need dependency-safe cleanup later. Do not redesign during consolidation.

### Deferred production proof

Because the user explicitly asked engineering work to continue, strict product QA for 16.2/16.3/16.4 is accumulated in **Slice 16.11 end-to-end closeout** rather than falsely marked VERIFIED PROD now.

---

## Ordered V0.5.16 plan

1. 16.0 canonical docs / continuation — ✅ CLOSED
2. 16.1 GitHub hygiene — ✅ CLOSED
3. 16.2 live Outfit sync parity — 🟡 merged, final two-device proof deferred to 16.11
4. 16.3 incomplete Outfit integrity — 🟡 merged, final device QA deferred to 16.11
5. 16.4 runtime hotfix consolidation — 🟡 merged / 12-of-12 PR CI green, final browser QA deferred to 16.11
6. **16.5 i18n architecture cleanup — 🔵 NEXT ACTIVE**
7. 16.6 version/cache normalization
8. 16.7 CI consolidation + browser smoke
9. 16.8 taxonomy unification
10. 16.9 repo/deployment governance
11. 16.10 branding source cleanup
12. 16.11 end-to-end closeout

**Do not start V0.5-B before V0.5.16 is closed.**

---

## Next canonical action

### Slice 16.5 — key-based FR / VI rendering

1. inventory canonical user-visible strings and dynamic messages by product surface;
2. introduce a keyed translation API with parameter interpolation;
3. migrate highest-risk dynamic surfaces first: navigation/header, Profile/sync diagnostics, Add/photo/AI, Outfit integrity/presentation, Daily Assistant;
4. preserve VI default and persistent FR selection;
5. replace text-observer translation only after migrated surfaces have behavior tests;
6. delete `i18n-runtime-compat.js` once no runtime surface relies on it;
7. keep final FR/VI leak/browser verification for Slice 16.11 unless a focused QA is performed earlier.

---

## Verification vocabulary

- **implemented** — code exists on a branch;
- **PR green** — required PR checks passed;
- **merged** — change is in `main`;
- **deployed** — the intended Pages/Worker state is independently confirmed;
- **VERIFIED PROD** — real production behavior was tested;
- **CLOSED** — documentation is updated and no required slice blocker remains.
