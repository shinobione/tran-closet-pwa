# PROJECT STATE — Trân's Closet PWA

> **Read this file first in every new work session, then read [`ROADMAP.md`](./ROADMAP.md).**
>
> This file records the current factual checkpoint. The roadmap records sequencing. If a chat transcript disagrees with the repository, re-verify `main` and follow the repository.

Last state update: **2026-08-19**

---

## Canonical production checkpoint

- repository: `shinobione/tran-closet-pwa`
- canonical branch: `main`
- version file: **`v0.5.16`**
- current runtime-changing main SHA: **`183a2650f1cfe95320bb6fde9c3d9768ea31f07c`** — V0.5.16 live Outfit sync parity
- Slice 16.2 PR: **#49**, merged after **10/10 PR workflows SUCCESS**
- canonical roadmap reset: PR **#46**, state closeout: PR **#47**
- GitHub hygiene closeout: PR **#48**, one-shot cleanup self-removal commit **`32295711db935cd9947fa361a3503438f3d50526`**
- PWA: `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker: `https://tran-closet-sync.jerryquinet.workers.dev`
- IndexedDB: `tran-closet`, schema version **4**
- Worker entrypoint currently configured by `worker/wrangler.toml`: `src/v059.js`

**Post-merge deployment is not claimed here yet.** The available GitHub connector does not expose `push`-triggered post-merge Actions runs. Also, docs-only commits after `183a2650…` may legitimately make GitHub Pages report a newer `main` SHA while still containing the exact V0.5.16 runtime from `183a2650…`. Pages + Worker deployment must therefore be independently confirmed before Slice 16.2 can be called deployed/VERIFIED PROD.

### Last known clean device diagnostic — v0.5.15 baseline

This is the pre-16.2 baseline to preserve, not a substitute for post-16.2 QA:

- clothing items: **11**
- outfits: **2**
- pending clothing mutations: **0**
- pending outfit mutations: **0**
- orphaned local clothing creates: **0**
- orphaned local outfits: **0**
- clothing flush: `ok: true`, `pending: 0`, `repaired: 0`
- outfit flush: `ok: true`, `pending: 0`, `repaired: 0`
- all 11 audited clothing items had an `airtableRecordId` and `syncState: "synced"`
- both audited outfits had an Airtable record and no pending queue entry

The stale clothing DELETE reconciliation bug targeting `rec6sAxfNivkTmiMp` remains considered **closed in v0.5.15+**.

---

## Phase status

- **V0.1 — Local Closet:** ✅ CLOSED
- **V0.2 — Airtable Bridge:** ✅ CLOSED / VERIFIED PROD
- **V0.3 — Outfits:** ✅ CLOSED / VERIFIED PROD
- **V0.4 — Smart Closet:** ✅ CLOSED / VERIFIED PROD
- **V0.5-A — Daily Assistant:** 🟢 deployed / operational; overall V0.5 remains open
- **V0.5.16 — Consolidation & Hardening:** 🔵 active engineering phase
  - **Slice 16.0 — canonical docs / continuation protocol:** ✅ CLOSED
  - **Slice 16.1 — GitHub hygiene:** ✅ CLOSED
  - **Slice 16.2 — live Outfit sync parity:** 🟡 MERGED / DEPLOYMENT + TWO-DEVICE QA PENDING
- **V0.5-B — Wear history & rotation:** ⏭ blocked until V0.5.16 closeout

Canonical principle remains:

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

Do **not** reconstruct status from a previous chat reply when these sources are available.

At the end of every merged slice, update this file and the roadmap if sequencing changed.

---

## What is working now

### Clothing cloud sync

- local-first IndexedDB CRUD;
- secured Worker write path;
- separate clothing mutation queue;
- idempotent Airtable create/update/delete;
- delete tombstones / anti-resurrection;
- canonical snapshot fallback;
- live canonical clothing reread through the Worker;
- live polling on app visibility/online state (roughly 30 s while visible);
- safe preservation of records with pending local mutations;
- stale cloud-backed rows removed locally only when no local mutation protects them;
- v0.5.15 CORS-safe canonical reread for stale DELETE reconciliation.

### Outfits

Existing verified foundation:
- offline-first local storage;
- scalable picker;
- separate Outfit mutation queue;
- Airtable persistence by linked clothing records;
- create/update/delete idempotency;
- Lookbook full-screen presentation;
- local PNG 1080×1350 generation and file sharing;
- snapshot anti-resurrection support.

Merged in V0.5.16 Slice 16.2 on `main`:
- authenticated Worker `GET /v1/outfits` using the existing read-only Airtable PAT;
- live canonical Outfit hydration after clothing hydration;
- visible/online polling roughly every 30 seconds;
- pending local Outfit mutations protected from canonical overwrite;
- remote canonical deletes propagated locally only when no pending local mutation protects the Outfit;
- pending deletes + Outfit tombstones block read-lag resurrection;
- live Outfit sync timestamp/count/error exposed in Profile diagnostics;
- pure behavior tests cover remote create/update/delete, pending update/delete protection and tombstone cleanup.

**Status:** code is merged and PR CI is green, but cross-device production behavior is **not yet VERIFIED PROD** until Worker + Pages deployment and real two-device QA are confirmed.

### Smart Closet / AI

- real Workers AI vision pipeline;
- multi-pass / rescue behavior;
- automatic retries;
- enriched wardrobe categories;
- fine-color pass introduced in the v0.5.9 Worker layer;
- confidence/reliability UX;
- Duplicate Guard;
- 22 Smart Tags;
- human validation before applying AI suggestions.

### Daily Assistant

- Open-Meteo current/daily weather;
- manual city geocoding;
- explicit browser geolocation;
- TP. Hồ Chí Minh default;
- occasion-aware ranking;
- existing Outfit ranking;
- generated top+bottom / one-piece looks when possible;
- contextual shoes/bag/headwear/umbrella;
- weather/tag/style/color/favorite signals;
- underwear/swimwear/lenses/socks excluded from automatic assembly;
- explicit save only.

### FR / VI

- Vietnamese remains default;
- persistent FR/VI QA switch exists;
- major screens and dynamic states are translated;
- several v0.5.9–v0.5.13 patches were needed to stabilize dynamic translations and Profile.

### Branding / PWA identity

Current production identity uses:
- `Trân's Closet`
- `Smart Fashion Wardrobe`
- horizontal header lockup;
- transparent logo mark;
- glossy app/favicon identity;
- Apple touch icon / PWA 192 / 512 / maskable icon;
- iPhone startup splash asset.

### Build identification

GitHub Pages generates `build-info.json` from:
- `VERSION`;
- exact deployed Git SHA;
- deployment build timestamp/run metadata.

The Profile version card uses this to distinguish repository version from the build actually served.

---

## Current data observations

Airtable audit on 2026-08-18 found:
- **11 clothing records**;
- **2 Outfit records**.

One Outfit named **`Lookbook Test`** currently contains only one linked clothing record (`Melody Bag`). The app normally requires at least two pieces at creation time, so this demonstrates a lifecycle integrity gap when linked clothing later disappears. V0.5.16 Slice 16.3 must represent this as **incomplete**, not auto-delete it.

Two older clothing items (`Melody Bag`, `Tui Xach`) had no Smart Tags during the last quality audit. This is not a sync bug and is non-blocking.

---

## Known technical debt / blockers

### Slice 16.2 closure blocker — deployment + real cross-device QA

The implementation is merged, but the slice remains open until all of these are proven on a deployed `main` build that contains runtime commit `183a2650…`:
- Pages reports `v0.5.16` and a deployed `main` SHA containing `183a2650…` (it may be a newer docs-only descendant);
- Worker live route `/v1/outfits` is deployed and authenticated read succeeds;
- create/update/delete on device A converges to device B without waiting for the 6-hour snapshot;
- a pending local Outfit edit is not overwritten by a live reread;
- diagnostics return a sane live Outfit count and no unexpected pending mutations/orphans.

### Runtime hotfix stack

`js/bootstrap.js` currently imports a mixture of canonical modules and historical patches/version-specific files, including v0.5.9, v0.5.10, v0.5.12, v0.5.13 and v0.5.16 layers. These fixes are proven useful but must be absorbed into canonical modules.

### i18n architecture

The FR/VI system still relies heavily on exact DOM-text replacement plus later dynamic patches. It works but is fragile and previously contributed to mutation-observer problems around Profile.

### PWA cache/version debt

The runtime version is v0.5.16, while the Service Worker cache namespace remains historically labeled `tran-closet-v0.5.1` and the app shell contains mixed query versions. This is not currently a known production failure, but it makes update/debug behavior unnecessarily difficult to reason about. Slice 16.6 owns the cleanup.

### CI fossilization

The repository contains multiple version-specific validation workflows (`validate-v058`, `validate-v059`, `validate-v0510`, `validate-v0512`, `validate-v0513`, `validate-v0514`, `validate-v0515`, `validate-v0516-outfit-live-sync`, etc.). Slice 16.2 added a behavior-focused gate, but the broader suite still needs consolidation in Slice 16.7.

### No browser-level smoke coverage

String/static guards did not prevent the Profile DOM-loop crash class. A small real-browser smoke suite is required.

### Taxonomy drift risk

Category/color/style/tag definitions are duplicated between client code, Worker layers and Airtable choices. Fine colors already differ between older Worker core definitions and later v0.5.9 logic.

### GitHub hygiene / governance

Slice 16.1 cleanup completed on 2026-08-19:
- obsolete branding recovery PR **#33** was closed without merge;
- cleanup PR **#48** ran a one-shot branch cleanup and was merged only to execute the repository operation;
- the runner deleted the proven merged/superseded historical branches and then removed itself from `main`;
- branch inventory was reduced to only `main` at Slice 16.1 closeout;
- open PR inventory was empty.

After Slice 16.2, the merged head branch `v0.5.16-live-outfit-sync` remains as a non-canonical branch because the available GitHub connector exposes no branch-delete mutation. It carries no unique work; `main` is authoritative. Branch lifecycle automation/protection is owned by Slice 16.9.

Remaining governance debt:
- `main` is still not protected;
- some automation workflows can commit generated snapshots/assets directly to `main`.

### Branding source clutter

Current identity is correct, but `branding/` still contains current and historical sources side-by-side. Clean only after dependency search; do not visually redesign during consolidation.

---

## V0.5.16 ordered plan

Full deliverables and exit criteria live in `docs/ROADMAP.md`.

1. 16.0 canonical docs / continuation protocol — ✅ CLOSED
2. 16.1 GitHub hygiene — ✅ CLOSED
3. 16.2 live Outfit sync parity — 🟡 MERGED / QA PENDING
4. 16.3 incomplete Outfit integrity
5. 16.4 runtime hotfix consolidation
6. 16.5 i18n architecture cleanup
7. 16.6 version/cache normalization
8. 16.7 CI consolidation + browser smoke
9. 16.8 taxonomy unification
10. 16.9 repo/deployment governance
11. 16.10 branding source cleanup
12. 16.11 end-to-end closeout

**Do not start V0.5-B before V0.5.16 is closed.**

---

## Next canonical action

### Close Slice 16.2 — deployment proof + two-device QA

1. Confirm GitHub Pages is serving **`v0.5.16`** via the Profile version card / `build-info.json`. The short SHA may be a docs-only `main` descendant newer than `183a265`; it only needs to contain the runtime commit `183a2650…`.
2. Confirm the deployed Worker accepts authenticated `GET /v1/outfits` and returns the canonical Outfit count.
3. With both devices online and configured with the same sync key:
   - create a disposable Outfit on device A and confirm it appears on device B in roughly ≤30 seconds;
   - update its name or favorite on device B and confirm device A converges without a manual snapshot refresh;
   - delete it on device A and confirm device B removes it without resurrection.
4. Run Profile diagnostics after convergence and verify:
   - `pendingMutations: 0`;
   - `pendingOutfitMutations: 0`;
   - no unexpected orphaned local outfits;
   - `liveOutfits.recordCount` matches canonical cloud state;
   - `liveOutfits.lastError` is null.
5. Only after those proofs: mark Slice 16.2 **VERIFIED PROD / CLOSED**, update docs, remove/clean the merged feature branch when tooling permits, then activate Slice 16.3.

---

## Verification vocabulary

Use these terms precisely:

- **implemented** — code exists on a branch;
- **PR green** — required PR checks passed;
- **merged** — change is in `main`;
- **deployed** — Pages/Worker deployment corresponding to the intended `main` state is confirmed;
- **VERIFIED PROD** — real production behavior was tested, not merely inferred from CI;
- **CLOSED** — docs/roadmap are updated and no required QA/blocker remains for that slice.
