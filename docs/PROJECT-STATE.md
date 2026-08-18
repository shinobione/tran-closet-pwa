# PROJECT STATE — Trân's Closet PWA

> **Read this file first in every new work session, then read [`ROADMAP.md`](./ROADMAP.md).**
>
> This file records the current factual checkpoint. The roadmap records sequencing. If a chat transcript disagrees with the repository, re-verify `main` and follow the repository.

Last state update: **2026-08-19**

---

## Canonical production checkpoint

- repository: `shinobione/tran-closet-pwa`
- canonical branch: `main`
- version file: **`v0.5.15`**
- last runtime-changing main SHA: **`f7227e41c439c1053f43e48941314d89ae12efdc`** — V0.5.15 CORS-safe delete reconciliation
- canonical roadmap reset: PR **#46**, state closeout: PR **#47**
- GitHub hygiene closeout: PR **#48**, one-shot cleanup self-removal commit **`32295711db935cd9947fa361a3503438f3d50526`**
- PWA: `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker: `https://tran-closet-sync.jerryquinet.workers.dev`
- IndexedDB: `tran-closet`, schema version **4**
- Worker entrypoint currently configured by `worker/wrangler.toml`: `src/v059.js`

The documentation and GitHub-hygiene work did **not** change runtime behavior, Worker code, Airtable data, branding assets or `VERSION`.

### Last known clean device diagnostic — v0.5.15

This is the baseline to preserve, not a substitute for re-checking after future changes:

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

The stale clothing DELETE reconciliation bug targeting `rec6sAxfNivkTmiMp` is considered **closed in v0.5.15**.

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
  - **Slice 16.2 — live Outfit sync parity:** 🔵 CURRENT / P1
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

- offline-first local storage;
- scalable picker;
- separate Outfit mutation queue;
- Airtable persistence by linked clothing records;
- create/update/delete idempotency;
- Lookbook full-screen presentation;
- local PNG 1080×1350 generation and file sharing;
- snapshot anti-resurrection support.

**Known asymmetry:** Outfit writes are live, but cross-device Outfit reads still need live-sync parity with clothing. This is V0.5.16 Slice 16.2 and is the current highest product-integrity priority.

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

### P1 — Live Outfit read parity

Clothing has live canonical cross-device reread. Outfits do not yet have equivalent live canonical polling. Until fixed, an Outfit written on one device may require the scheduled snapshot before another device sees the canonical change.

### Runtime hotfix stack

`js/bootstrap.js` currently imports a mixture of canonical modules and historical patches/version-specific files, including v0.5.9, v0.5.10, v0.5.12, v0.5.13 and v0.5.15 layers. These fixes are proven useful but must be absorbed into canonical modules.

### i18n architecture

The FR/VI system still relies heavily on exact DOM-text replacement plus later dynamic patches. It works but is fragile and previously contributed to mutation-observer problems around Profile.

### PWA cache/version debt

The runtime version is v0.5.15, while the Service Worker cache namespace remains historically labeled `tran-closet-v0.5.1` and the app shell contains mixed query versions. This is not currently a known production failure, but it makes update/debug behavior unnecessarily difficult to reason about.

### CI fossilization

The repository contains multiple version-specific validation workflows (`validate-v058`, `validate-v059`, `validate-v0510`, `validate-v0512`, `validate-v0513`, `validate-v0514`, `validate-v0515`, etc.). Many are valuable regression guards, but they need consolidation toward behavior-focused tests.

### No browser-level smoke coverage

String/static guards did not prevent the Profile DOM-loop crash class. A small real-browser smoke suite is required.

### Taxonomy drift risk

Category/color/style/tag definitions are duplicated between client code, Worker layers and Airtable choices. Fine colors already differ between older Worker core definitions and later v0.5.9 logic.

### GitHub hygiene / governance

Slice 16.1 cleanup completed on 2026-08-19:
- obsolete branding recovery PR **#33** was closed without merge;
- cleanup PR **#48** ran a one-shot branch cleanup and was merged only to execute the repository operation;
- the runner deleted the proven merged/superseded historical branches and then removed itself from `main`;
- branch inventory now contains **only `main`**;
- open PR inventory is **empty**.

Remaining governance debt is deliberately deferred to Slice 16.9:
- `main` is still not protected;
- some automation workflows can commit generated snapshots/assets directly to `main`.

### Branding source clutter

Current identity is correct, but `branding/` still contains current and historical sources side-by-side. Clean only after dependency search; do not visually redesign during consolidation.

---

## V0.5.16 ordered plan

Full deliverables and exit criteria live in `docs/ROADMAP.md`.

1. 16.0 canonical docs / continuation protocol — ✅ CLOSED
2. 16.1 GitHub hygiene — ✅ CLOSED
3. 16.2 live Outfit sync parity — 🔵 CURRENT / P1
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

### Slice 16.2 — live Outfit sync parity (P1)

1. Add authenticated canonical `GET /v1/outfits` in the Worker using the existing read-only Airtable path/credentials.
2. Add client `syncLiveCanonicalOutfits()` equivalent to clothing live sync.
3. Preserve outfits protected by pending local Outfit mutations during reconciliation.
4. Propagate canonical remote deletes locally only when no local pending mutation protects the Outfit.
5. Add visibility/online polling parity with clothing.
6. Extend diagnostics with live Outfit record count plus last sync/error state.
7. Add behavior-focused regression coverage for create/update/delete cross-device reconciliation and pending-write protection.
8. Merge only after CI is green; then deploy Worker/PWA as required and perform real two-device QA before calling the slice VERIFIED PROD/CLOSED.

---

## Verification vocabulary

Use these terms precisely:

- **implemented** — code exists on a branch;
- **PR green** — required PR checks passed;
- **merged** — change is in `main`;
- **deployed** — Pages/Worker deployment corresponding to the intended `main` state is confirmed;
- **VERIFIED PROD** — real production behavior was tested, not merely inferred from CI;
- **CLOSED** — docs/roadmap are updated and no required QA/blocker remains for that slice.
