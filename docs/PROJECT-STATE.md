# PROJECT STATE — Trân's Closet PWA

> **Read this file first in every new work session, then read [`ROADMAP.md`](./ROADMAP.md).**
>
> This file records the current factual checkpoint. If chat history disagrees with the repository, re-verify `main` and follow the repository.

Last state update: **2026-08-20**

---

## Canonical checkpoint

- repository: `shinobione/tran-closet-pwa`
- canonical branch: `main`
- current **production/runtime** release boundary: **`v0.5.17`**
- current `main` at B.1 closeout: **`6c2f3051bf06a91bef98b31496e2905412737602`**
- B.1 merge: PR **#71** — `V0.5-B.1 · Wear-event foundation`
- IndexedDB: `tran-closet`, schema version **5**
- PWA: `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker production lineage before B.2: **v059**
- canonical taxonomy: `canonical-v1`, **17 categories / 24 colors / 6 styles / 22 tags**
- active engineering branch: **`v0.5.18-wear-history-sync`**
- active PR: **#72 — `V0.5-B.2 · Canonical wear-history sync`** (draft)
- B.2 release candidate identity on the PR branch: **`v0.5.18`**
- B.2 release-reference normalization commit: **`2ba841f319f36c04ae1c90f0dabc796c13f15026`**

**Do not infer deployment from merge.** `MERGED`, `PAGES DEPLOYED`, `WORKER DEPLOYED` and `VERIFIED PROD` are separate claims.

---

## Phase / slice status

- **V0.1 — Local Closet:** ✅ CLOSED
- **V0.2 — Airtable Bridge:** ✅ CLOSED / VERIFIED PROD
- **V0.3 — Outfits:** ✅ CLOSED / VERIFIED PROD
- **V0.4 — Smart Closet:** ✅ CLOSED / VERIFIED PROD
- **V0.5-A — Daily Assistant:** ✅ OPERATIONAL / VERIFIED in current product
- **V0.5.16 — Consolidation & Hardening:** ✅ CLOSED / VERIFIED PROD
- **V0.5-B — Wear history & rotation:** 🔵 ACTIVE
  - **B.1 — Wear-event foundation:** ✅ **VERIFIED PROD**
  - **B.2 — Canonical wear-history sync:** 🔵 **CURRENT / RELEASE CANDIDATE**
  - B.3 — Rotation signal in Daily Assistant: ⏭ NEXT after B.2 production proof
  - B.4 — History UX / closeout: ⏭ later

Canonical product principle:

> **IA and heuristics propose; Trân decides before any canonical or destructive write.**

No wear event may be inferred from opening, sharing, favoriting, editing or merely viewing an Outfit.

---

## V0.5.16 final production baseline

V0.5.16 was closed through PR #70 (`269966610958ec4cc94a68cdbc16e5bb3f2b2250`) after the complete 16.11 matrix.

Verified production behavior included:

- clothing CREATE / UPDATE / DELETE cross-device auto-convergence;
- Outfit CREATE / UPDATE / DELETE cross-device auto-convergence;
- no manual refresh / no `Synchroniser maintenant` required for those live rereads;
- incomplete Outfit warning / no auto-delete / share suppression / Daily Assistant exclusion;
- offline mutation recovery;
- Profile stability;
- uninterrupted search typing;
- explicit Camera + Gallery choice;
- FR / VI migrated surfaces;
- AI human-in-the-loop: proposal → Apply only changes form → explicit save still required.

Final clean baseline after disposable E2E cleanup:

- **11 clothing items**;
- **3 Outfits**;
- **0 pending clothing mutations**;
- **0 pending Outfit mutations**;
- **0 orphaned local clothing creates**;
- **0 orphaned local Outfits**;
- clothing + Outfit flushes clean;
- Worker identity `v059 / canonical-v1 / 17-24-6-22` verified during closeout.

`Lookbook Test` remains intentionally retained as a real incomplete-Outfit lifecycle witness.

---

## B.1 — Wear-event foundation ✅ VERIFIED PROD

### Shipped architecture

PR #71 / merge **`6c2f3051bf06a91bef98b31496e2905412737602`** introduced:

- `VERSION = v0.5.17`;
- IndexedDB schema **5**;
- dedicated `wearEvents` store;
- `js/wear-history-core.mjs` event model;
- deterministic one-event-per-Outfit/per-local-day IDs;
- explicit **`Porté aujourd’hui / Đã mặc hôm nay`** action on complete saved Outfits only;
- explicit **Undo today**;
- immutable Outfit-name + item-ID snapshots in each local event;
- derived Outfit wear count / last worn;
- derived clothing wear count / last worn;
- backup JSON V5 with wear events;
- offline persistence;
- no Worker/Airtable history write in B.1;
- no Daily Assistant rotation/ranking change in B.1.

### B.1 production proof

Real installed-PWA QA passed:

- app reported **v0.5.17**;
- explicit `Porté aujourd’hui` action visible on a complete Outfit;
- one tap created one wear event;
- Outfit wear count and last-worn changed correctly;
- clothing stats reflected the event;
- `Annuler aujourd’hui` removed the event and recomputed stats correctly;
- Outfit/clothing canonical records were not modified as a side effect.

Acceptance token: **`WEAR + UNDO PASS`**.

Therefore **B.1 = VERIFIED PROD**. Do not ask the user to repeat this QA.

---

## B.2 — Canonical wear-history sync 🔵 CURRENT

### Canonical Airtable schema already created

Base: `appw8WNvdDuXUgYvN`

New table: **`Wear History`** — `tblnkYdIz1dVZZhEF`

Fields:

- `Wear Event ID` — stable deterministic idempotency key;
- `Schema Version`;
- `Outfit ID`;
- `Outfit Name Snapshot`;
- `Item Record IDs Snapshot` — JSON array of canonical clothing Airtable record IDs;
- `Worn At` — ISO-8601 timestamp;
- `Worn Date` — wearer-local `YYYY-MM-DD`;
- `Created At`;
- `Updated At`.

The table was created empty. Creating the schema did **not** modify Clothes or Outfits.

Design rule: history stores stable canonical IDs/snapshots rather than relying only on Airtable links, so old history survives later Outfit/item edits or deletion.

### B.2 engineering / release candidate

Active branch: **`v0.5.18-wear-history-sync`**  
Draft PR: **#72**  
Candidate release: **`v0.5.18`**

Candidate architecture includes:

- separate durable wear mutation queue (`wear-mutation-queue` in IndexedDB metadata);
- offline create/delete queueing;
- local clothing IDs resolved to canonical Airtable record IDs before upload;
- Worker **v060** candidate;
- authenticated `GET /v1/wear-events`;
- idempotent `POST /v1/wear-mutations` with upsert on `Wear Event ID`;
- delete fallback by stable `Wear Event ID` when a CREATE may have committed but its response was lost;
- live wear reread with focus/pageshow/visibility/30-second checks;
- pending mutation + tombstone anti-resurrection protection;
- cross-device remapping of canonical clothing record IDs back to each device's local item IDs;
- reset/restore clears wear history queue + tombstones with local history;
- manual Sync Now extended to wear history;
- Profile diagnostics extended with wear pending/orphan/live/flush state;
- Service Worker offline shell wiring;
- Worker deployment smoke candidate requires `workerRevision:v060`, `wearHistory:canonical-v1` and a canonical `/v1/wear-events` read;
- Daily Assistant ranking intentionally unchanged in B.2.

Engineering gate completed before the release bump:

- PR head **`a060fac2600a9c395cfecc5e35a33f07fd18ba38`**: **9/9 PR workflows green**;
- wear-event model test: green;
- live wear reconciliation test: green;
- pending/tombstone anti-resurrection guards: green;
- browser smoke: green;
- existing clothing / Outfit / i18n / Profile / runtime / version-cache gates: green.

Release normalization is now complete:

- `VERSION = v0.5.18`;
- all 25 runtime release references were normalized by the repository's canonical `normalize-release-refs.mjs --write` tool;
- bootstrap imports and Service Worker app shell now consistently use `0.5.18`;
- the one-shot normalizer workflow deleted itself and is **not** a permanent repository writer.

### B.2 verification boundary

Do **not** call B.2 merged, deployed or verified yet.

Sequence status:

1. PR #72 engineering CI green — ✅ **9/9** on `a060fac…`;
2. release boundary normalized to **v0.5.18** — ✅ on `2ba841f…`;
3. final PR 9/9 green — 🔵 **CURRENT GATE**;
4. merge to `main` — pending;
5. independently verify Pages deployment — pending;
6. independently verify Worker v060 deployment + `/v1/wear-events` — pending;
7. real PC ↔ phone QA — pending:
   - device A marks a complete Outfit worn;
   - device B auto-sees wear stats without refresh/manual sync;
   - device B undoes it;
   - device A auto-clears it without resurrection;
   - offline queue recovery;
   - final diagnostic: 0 wear pending, 0 wear orphan, live wear error null.

Only then may B.2 be marked **VERIFIED PROD** and B.3 opened.

---

## V0.5.16 consolidation lineage

Important runtime merges:

- #49 live Outfit parity → `183a2650f1cfe95320bb6fde9c3d9768ea31f07c`
- #50 Outfit UI convergence → `6ed2bcd345fcaf8c98ba03abdad9ad876ee6a21f`
- #51 incomplete Outfit integrity → `f3cf862d94c7186773a35f0fca511838d68bd5d8`
- #52 runtime consolidation → `082487fc938bbbed47e37a00727a23989a58a99b`
- #56 dynamic i18n closeout → `536e7157793e2fc5d237656fc98ebd98ba633b7f`
- #58 version/cache normalization → `1bb94d173d6ae1ad7a7833063a0fe45542a7ec80`
- #60 CI consolidation/browser smoke → `19b32a12de6752b5b610e502789c22f27e2a225d`
- #62 taxonomy unification → `f748d0b62bc4f610009eee886d7c5e5689c80477`
- #64 repository/deployment governance → `a1689d14548c4ecbffe2e4b526d6db655f546ead`
- #66 canonical branding cleanup → `c13f2e380fd2228375372e31ead06537f647deb1`
- #68 Worker observability → `5041cf0236486dbed7903f190111400065074cf2`
- #69 live clothing convergence → `abc27014929f5c0bb0bb35c50af390fd50bbe36a`
- #70 V0.5.16 closeout → `269966610958ec4cc94a68cdbc16e5bb3f2b2250`
- #71 B.1 wear-event foundation → `6c2f3051bf06a91bef98b31496e2905412737602`

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

Continue **PR #72 / B.2** only:

1. obtain final **v0.5.18** 9/9 PR green;
2. if green, mark #72 ready and merge through the normal repository path;
3. independently verify Pages + Worker v060 deployment;
4. run one focused PC ↔ phone wear create/undo + offline recovery QA;
5. close B.2 only after a clean wear diagnostic.

Do not start B.3 before B.2 canonical sync is proven.

---

## Verification vocabulary

- **implemented** — code exists on a branch;
- **PR green** — required PR checks passed;
- **merged** — change is in `main`;
- **Pages deployed** — intended Pages SHA/build is independently confirmed;
- **Worker deployed** — intended Worker identity/endpoints are independently confirmed;
- **VERIFIED PROD** — real production behavior was tested;
- **CLOSED** — documentation is updated and no required slice blocker remains.
