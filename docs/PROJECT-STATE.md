# PROJECT STATE — Trân's Closet PWA

> **Read this file first in every new work session, then read [`ROADMAP.md`](./ROADMAP.md).**
>
> This file records the current factual checkpoint. If chat history disagrees with the repository, re-verify `main` and follow the repository.

Last state update: **2026-08-20**

---

## Canonical checkpoint

- repository: `shinobione/tran-closet-pwa`
- canonical branch: `main`
- version file: **`v0.5.16`**
- `main` at the start of this closeout documentation: **`df40f84ab8ae5f1c78f67f7ce236cd1ff7501b31`** (`Sync Airtable closet snapshots`)
- last runtime-changing merge: **`abc27014929f5c0bb0bb35c50af390fd50bbe36a`** — live clothing cross-device convergence hotfix
- PWA: `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker: `https://tran-closet-sync.jerryquinet.workers.dev`
- IndexedDB: `tran-closet`, schema version **4**
- Worker entrypoint: `worker/src/v059.js`
- deployed Worker identity verified during closeout: **`workerRevision: v059`**
- deployed taxonomy identity verified during closeout: **`canonical-v1`**, **17 categories / 24 colors / 6 styles / 22 tags**

**Do not infer deployment from merge.** `MERGED`, `PAGES DEPLOYED`, `WORKER DEPLOYED` and `VERIFIED PROD` remain separate claims.

---

## Phase / slice status

- **V0.1 — Local Closet:** ✅ CLOSED
- **V0.2 — Airtable Bridge:** ✅ CLOSED / VERIFIED PROD
- **V0.3 — Outfits:** ✅ CLOSED / VERIFIED PROD
- **V0.4 — Smart Closet:** ✅ CLOSED / VERIFIED PROD
- **V0.5-A — Daily Assistant:** ✅ OPERATIONAL / VERIFIED in the current product
- **V0.5.16 — Consolidation & Hardening:** ✅ **CLOSED / VERIFIED PROD**
  - 16.0 canonical docs / continuation: ✅
  - 16.1 GitHub hygiene: ✅
  - 16.2 live Outfit sync parity: ✅ VERIFIED PROD in final cross-device CRUD matrix
  - 16.3 incomplete Outfit integrity: ✅ VERIFIED PROD
  - 16.4 runtime consolidation: ✅ VERIFIED PROD
  - 16.5 keyed FR/VI i18n cleanup: ✅ VERIFIED PROD
  - 16.6 version/cache normalization: ✅ VERIFIED PROD
  - 16.7 CI consolidation + browser smoke: ✅
  - 16.8 taxonomy unification: ✅ Worker deployment identity verified
  - 16.9 repository/deployment governance: ✅
  - 16.10 branding source cleanup: ✅
  - 16.11 end-to-end closeout: ✅ **CLOSED / VERIFIED PROD**
- **V0.5-B — Wear history & rotation:** 🔵 **ACTIVE / NEXT PRODUCT SLICE**

Canonical product principle:

> **IA and heuristics propose; Trân decides before any canonical or destructive write.**

---

## V0.5.16 final production evidence

### Deployment / identity

During Slice 16.11 the installed production app reported **v0.5.16** and the Worker health contract reported:

- `ok: true`;
- `workerRevision: v059`;
- `taxonomy: canonical-v1`;
- taxonomy counts `17 / 24 / 6 / 22`.

The exact Pages SHA can advance after runtime work because generated Airtable snapshot commits are legitimate `main` descendants. The runtime boundary used for closeout is therefore recorded separately from the current docs/snapshot HEAD. The last runtime-changing merge in the final tested lineage is **`abc27014929f5c0bb0bb35c50af390fd50bbe36a`**.

### Cross-device clothing CRUD

Real production QA, without browser refresh or `Synchroniser maintenant`:

- CREATE/live visibility: ✅
- phone → cloud → PC UPDATE auto-convergence: ✅ `UPDATE AUTO PASS`
- PC → cloud → phone DELETE auto-convergence: ✅ `DELETE AUTO PASS`
- no observed resurrection after delete: ✅

PR **#69** / merge **`abc27014929f5c0bb0bb35c50af390fd50bbe36a`** removed `location.reload()` from clothing live convergence, emits `tran:items-live-changed`, refreshes the UI internally, adds foreground/visibility checks, exposes live clothing diagnostics and protects pending deletes/tombstones.

### Cross-device Outfit CRUD

Real production QA, without browser refresh or manual sync:

- `OUTFIT CREATE AUTO PASS` ✅
- `OUTFIT UPDATE AUTO PASS` ✅
- `OUTFIT DELETE AUTO PASS` ✅
- no observed resurrection after delete ✅

This closes the production proof deferred from Slice 16.2.

### Consolidated mobile/UI QA

User-reported production passes:

- `STATIC QA PASS` ✅ — FR/VI navigation, uninterrupted search typing, explicit Camera + Gallery choice, Profile stability and navigation;
- `INCOMPLETE OUTFIT PASS` ✅ — incomplete warning, no auto-delete, share suppressed, manual repair/delete retained, incomplete Outfit excluded from Daily Assistant complete-look ranking;
- `OFFLINE QUEUE PASS` ✅ — local offline create, pending queue, automatic recovery after network return, cross-device convergence and queue return to zero;
- `AI HUMAN LOOP PASS` ✅ — AI proposal does not mutate the form before Apply; Apply changes form fields only; no canonical save occurs without the explicit save action.

`Lookbook Test` remains intentionally retained as the real incomplete-Outfit lifecycle case. It must not be auto-deleted or silently repaired.

### Final clean diagnostic baseline

After disposable E2E cleanup and the AI non-save test, the user confirmed the final Profile diagnostic was **clean**.

Canonical closeout baseline:

- clothing items: **11**;
- outfits: **3**;
- pending clothing mutations: **0**;
- pending Outfit mutations: **0**;
- orphaned local clothing creates: **0**;
- orphaned local Outfits: **0**;
- clothing flush: `ok: true`, `pending: 0`;
- Outfit flush: `ok: true`, `pending: 0`;
- live clothing / Outfit rereads: no reported closeout error;
- no retained `E2E ITEM`, `E2E OUTFIT`, `OFFLINE E2E TEST` or `AI HIL TEST` artifact.

The stale clothing DELETE reconciliation bug targeting `rec6sAxfNivkTmiMp` remains closed in v0.5.15+.

---

## Consolidation delivered in V0.5.16

### Runtime and sync

- live canonical clothing + Outfit reads through the Worker;
- roughly 30-second visible polling plus focus/pageshow/online checks;
- internal UI refresh events (`tran:items-live-changed`, `tran:outfits-live-changed`) instead of page reloads;
- pending-local-mutation and tombstone anti-resurrection protection;
- separate clothing and Outfit offline queues;
- CORS-safe stale DELETE reconciliation;
- Profile diagnostics for live/read/queue state.

### Outfit integrity

- complete/incomplete is derived from **resolved** linked clothing count;
- fewer than 2 resolved pieces => incomplete;
- no automatic canonical repair/delete;
- incomplete warning is bilingual;
- edit/favorite/delete remain available;
- share-ready Lookbook output is suppressed until repaired;
- Daily Assistant excludes incomplete saved Outfits from complete-look ranking.

### Runtime cleanup

The version-named hotfix chain was absorbed into canonical controllers. Current permanent controllers include:

- `app-refresh.js`;
- `closet-search-core.mjs` + `closet-search.js`;
- `photo-picker.js`;
- `manual-sync.js`;
- keyed i18n via `i18n-keyed.mjs`.

The old recursive body-wide translation observer and the historical runtime hotfix files are gone.

### i18n

- render-time keyed FR/VI strings for high-risk dynamic surfaces;
- structured Daily Assistant and Duplicate Guard reason descriptors;
- Photo AI sends active language to the Worker;
- no global recursive DOM translation observer.

### Version / cache

- `VERSION` remains the source release identity;
- deployed `build-info.json` identifies exact Pages build SHA;
- Service Worker cache identity derives from version + short SHA;
- `updateViaCache: 'none'` is preserved;
- release-reference normalization and cache/app-shell drift tests are permanent.

### CI

- 14 historical/version-specific gates consolidated to **9 current workflows**;
- deterministic system-Chrome smoke covers boot, search focus, Add/Camera/Gallery, Profile/diagnostics, Outfits, Daily Assistant and FR↔VI;
- page exceptions and failed local script/style loads are fatal.

### Canonical taxonomy

`shared/taxonomy.json` is the single repository source for:

- **17 categories**;
- **24 colors**;
- **6 styles**;
- **22 tags**;
- VI/FR labels and the intentional Airtable storage compatibility alias for `Swimware `.

### Repository / deployment governance

- only Airtable snapshot + branding generation retain permanent generated-content write authority;
- both share `generated-main-writes` concurrency and the collision-safe generated-artifact helper;
- no force-push / workflow self-mutation is allowed by governance CI;
- `main` remains factually **unprotected**; do not claim otherwise.

### Branding

Exactly four approved visual masters remain canonical under `branding/`; the generator/CI guards byte-lock and reproduce the system icon outputs without redesigning the approved artwork.

---

## Important runtime lineage

- #49 live Outfit parity → `183a2650f1cfe95320bb6fde9c3d9768ea31f07c`
- #50 Outfit UI convergence → `6ed2bcd345fcaf8c98ba03abdad9ad876ee6a21f`
- #51 incomplete Outfit integrity → `f3cf862d94c7186773a35f0fca511838d68bd5d8`
- #52 runtime consolidation → `082487fc938bbbed47e37a00727a23989a58a99b`
- #54 keyed i18n foundation → `add11b112482a3718784b27969e0c0aa84200693`
- #55 i18n compat retirement → `128671489d95177592305d1456e463cd4e24d697`
- #56 dynamic i18n closeout → `536e7157793e2fc5d237656fc98ebd98ba633b7f`
- #58 version/cache normalization → `1bb94d173d6ae1ad7a7833063a0fe45542a7ec80`
- #60 CI consolidation/browser smoke → `19b32a12de6752b5b610e502789c22f27e2a225d`
- #62 taxonomy unification → `f748d0b62bc4f610009eee886d7c5e5689c80477`
- #64 repo/deployment governance → `a1689d14548c4ecbffe2e4b526d6db655f546ead`
- #66 canonical branding cleanup → `c13f2e380fd2228375372e31ead06537f647deb1`
- #68 Worker deployment identity/observability → `5041cf0236486dbed7903f190111400065074cf2`
- #69 live clothing cross-device convergence → `abc27014929f5c0bb0bb35c50af390fd50bbe36a`

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

## Next canonical action

### V0.5-B — Wear history & rotation

V0.5.16 is closed. New product work is unblocked.

Start with **V0.5-B.1 — Wear-event foundation**:

1. define a durable local wear-event contract with stable IDs and explicit timestamps;
2. add a manual **Worn today / Porté aujourd'hui / Đã mặc hôm nay** action for complete saved Outfits;
3. derive `last worn`, wear count and per-item usage from events rather than destructive counters;
4. preserve offline-first behavior and keep all new canonical writes explicit;
5. do **not** change Daily Assistant ranking until the event model is proven;
6. follow with canonical Worker/Airtable sync and live cross-device history in B.2 before using rotation as a recommendation signal.

No automatic wear event may be inferred merely from opening, sharing or favoriting an Outfit.

---

## Verification vocabulary

- **implemented** — code exists on a branch;
- **PR green** — required PR checks passed;
- **merged** — change is in `main`;
- **deployed** — the intended Pages/Worker state is independently confirmed;
- **VERIFIED PROD** — real production behavior was tested;
- **CLOSED** — documentation is updated and no required slice blocker remains.
