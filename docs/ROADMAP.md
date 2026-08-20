# MASTER ROADMAP — Trân's Closet PWA

> **Canonical project roadmap.** Current factual runtime state lives in [`PROJECT-STATE.md`](./PROJECT-STATE.md). Repo truth wins over chat history.

Last roadmap update: **2026-08-20**  
Current slice: **V0.5-B.2 — Canonical wear-history sync**

---

## 0. Session continuation protocol

At the start of every new work session/window:

1. read `VERSION`;
2. read `docs/PROJECT-STATE.md`;
3. read this `docs/ROADMAP.md`;
4. verify current `main` SHA and open PRs;
5. verify CI / Pages / Worker separately when deployment matters;
6. continue from the current slice unless the user explicitly changes priority.

At the end of every merged slice:

1. update `VERSION` if runtime changed;
2. update `PROJECT-STATE.md`;
3. update this roadmap;
4. record exact merge SHA and QA state;
5. never write `VERIFIED PROD` without real production QA.

### Non-negotiable rules

- **Repo > chat memory.**
- **One active slice at a time.**
- **Human-in-the-loop stays canonical.** IA/heuristics may propose; Trân decides before canonical/destructive writes.
- **No deployment claims without proof.** `MERGED`, `PAGES DEPLOYED`, `WORKER DEPLOYED` and `VERIFIED PROD` are separate states.
- **Offline-first is part of the product contract.**
- **No automatic wear event may be inferred from opening, sharing, favoriting, editing or viewing an Outfit.**

---

## 1. Closed foundations

### V0.1 — Local Closet ✅ CLOSED
- installable/offline PWA;
- IndexedDB;
- clothing CRUD;
- search / filters / favorites;
- JSON backup.

### V0.2 — Airtable Bridge ✅ CLOSED / VERIFIED PROD
- canonical Airtable clothing storage;
- secured Cloudflare Worker;
- offline mutation queue;
- idempotency / delete reconciliation / anti-resurrection;
- real clothing CREATE + photo / UPDATE / DELETE verified.

### V0.3 — Outfits ✅ CLOSED / VERIFIED PROD
- offline-first Outfit Core;
- scalable picker;
- Airtable linked-record persistence;
- separate Outfit mutation queue;
- Lookbook + PNG/Web Share;
- CRUD / live sync / anti-resurrection verified.

### V0.4 — Smart Closet ✅ CLOSED / VERIFIED PROD
- assisted image analysis;
- reliability retries;
- duplicate guard;
- canonical Smart Tags;
- human validation before any canonical AI-assisted write.

---

## 2. V0.5-A — `Hôm nay mặc gì?` ✅ OPERATIONAL

- Open-Meteo weather context;
- HCMC default + manual city + explicit geolocation;
- occasion-aware ranking;
- existing Outfit + generated-look candidates;
- contextual accessories;
- exclusions for underwear/swimwear/lenses/socks;
- Smart Tags/styles/colors/favorites as signals;
- explicit save only;
- FR/VI;
- current clothing + Outfit live convergence.

---

## 3. V0.5.16 — Consolidation & Hardening ✅ CLOSED / VERIFIED PROD

Delivered and production-validated:

- canonical recovery docs and verification vocabulary;
- GitHub hygiene;
- live Outfit sync parity;
- incomplete Outfit integrity state;
- canonical runtime controllers replacing hotfix chains;
- keyed FR/VI architecture on high-risk dynamic surfaces;
- version/cache normalization from `VERSION` + deployed SHA;
- 14 → 9 CI workflows + real Chrome smoke;
- canonical shared taxonomy: **17 categories / 24 colors / 6 styles / 22 tags**;
- repository/deployment governance;
- canonical branding-source cleanup;
- end-to-end mobile/cross-device closeout.

Final 16.11 QA included clothing + Outfit cross-device CRUD, static FR/VI/search/photo/Profile QA, incomplete Outfit behavior, offline recovery, AI human-in-loop and clean diagnostics.

Closeout PR #70 → **`269966610958ec4cc94a68cdbc16e5bb3f2b2250`**.

---

# 4. V0.5-B — Wear history & rotation 🔵 ACTIVE

Goal: reduce repetition and surface under-used clothes **without forcing choices**.

## B.1 — Wear-event foundation ✅ VERIFIED PROD

PR #71 → merge **`6c2f3051bf06a91bef98b31496e2905412737602`**  
Release boundary: **v0.5.17**  
IndexedDB schema: **5**

Delivered:

- dedicated `wearEvents` store;
- deterministic one-event-per-Outfit/per-local-day ID;
- explicit `Porté aujourd’hui / Đã mặc hôm nay` on complete saved Outfits only;
- explicit Undo today;
- Outfit name + resolved clothing snapshot per event;
- derived Outfit wear count / last worn;
- derived per-item wear count / last worn;
- reversible event model instead of destructive counters;
- offline persistence;
- backup JSON V5;
- Daily Assistant ranking deliberately unchanged.

Production acceptance:

- installed app showed v0.5.17;
- one explicit tap created the event and updated Outfit + clothing stats;
- Undo removed the event and recomputed previous stats correctly;
- incomplete Outfit guard remained intact;
- no clothing/Outfit canonical record was mutated merely to compute usage.

Acceptance token: **`WEAR + UNDO PASS`**.

**Do not repeat this QA.**

## B.2 — Canonical wear-history sync 🔵 CURRENT

Active engineering:

- branch `v0.5.18-wear-history-sync`;
- draft PR **#72**;
- canonical Airtable table **`Wear History`** / `tblnkYdIz1dVZZhEF` already created empty;
- stable `Wear Event ID` idempotency key;
- Outfit/name/clothing-record snapshots retained so history survives later edits/deletes;
- separate durable wear mutation queue;
- explicit create/delete only;
- Worker **v060 candidate**;
- `GET /v1/wear-events`;
- idempotent `POST /v1/wear-mutations`;
- live cross-device reread;
- pending/tombstone anti-resurrection protection;
- canonical clothing record IDs remapped to each device's local IDs;
- manual Sync Now + Profile diagnostics extended to wear history;
- offline Service Worker runtime;
- pure reconciliation tests;
- Daily Assistant rotation scoring forbidden in this slice.

### B.2 acceptance gates

1. engineering candidate PR checks green while still on v0.5.17;
2. normalize release boundary to **v0.5.18**;
3. final PR **9/9 green**;
4. merge to `main`;
5. independently verify **Pages DEPLOYED**;
6. independently verify **Worker DEPLOYED = v060 + wearHistory canonical-v1**;
7. real PC ↔ phone QA:
   - device A marks a complete Outfit worn;
   - device B auto-sees stats without refresh/manual sync;
   - device B Undo propagates back without resurrection;
   - offline create/reconnect queue recovery;
8. final diagnostic:
   - wear pending `0`;
   - wear orphan `0`;
   - live wear error `null`.

Only then: **B.2 VERIFIED PROD**.

## B.3 — Rotation signal in Daily Assistant ⏭ NEXT

Only after B.2 canonical history is trustworthy:

- recency penalty for recently worn looks/items;
- under-used clothing boost;
- transparent/explainable reason text;
- weather/occasion/compatibility remain stronger constraints than rotation;
- favorites may influence ranking but never override hard constraints;
- no automatic save or wear logging.

## B.4 — History UX / V0.5-B closeout

- recent-wear timeline;
- undo/delete mistaken historical event;
- clear `last worn` display;
- useful empty state;
- FR/VI QA;
- offline + cross-device + assistant regression matrix;
- final diagnostic clean before V0.5-B closeout.

---

## 5. Product roadmap after V0.5-B

### V0.5-C — Conversational closet assistant

- natural questions over canonical wardrobe data;
- future date/occasion/weather planning;
- detailed reasoning on demand;
- human-in-the-loop for all saved changes.

### V0.6 — Daily Driver hardening / productization

Candidate themes:

- private access/auth strategy;
- optional reminders/notifications;
- deeper iPhone/PWA polish;
- install/update UX;
- backup/restore UX hardening;
- recovery/observability for non-technical use.

### V1.0 — Daily Driver

Minimum target:

- trustworthy cross-device canonical data;
- stable install/update/offline behavior;
- useful assistant workflow;
- understandable recovery/diagnostics;
- no developer intervention for routine use.

---

## 6. Explicit deferred / backlog

- replace photo of an already Airtable-backed clothing record;
- richer color nuance beyond current canonical set;
- smarter 2/3/4+ Lookbook composition;
- optional background removal/cutout;
- richer accessory/style semantics;
- notifications;
- public/shareable links.

---

## 7. Status legend

- ✅ **CLOSED / VERIFIED PROD** — production behavior verified with real QA.
- 🟢 **OPERATIONAL** — capability exists in current product; parent phase may still be open.
- 🔵 **CURRENT / ACTIVE** — active engineering slice.
- 🟡 **MERGED / QA DEFERRED** — code is in `main`, required product proof remains.
- ⏭ **NEXT** — explicitly sequenced after current blocker/phase.
- ⏸ **DEFERRED** — deliberately postponed.
