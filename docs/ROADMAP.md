# MASTER ROADMAP — Trân's Closet PWA

> **Canonical project roadmap.** This file is the source of truth for sequencing work across successive ChatGPT/Codex sessions.
>
> Current factual runtime state lives in [`PROJECT-STATE.md`](./PROJECT-STATE.md). When chat history and the repository disagree, verify `main` and follow the repository.

Last roadmap update: **2026-08-20**  
Current slice: **V0.5-B.1 — Wear-event foundation**

---

## 0. Session continuation protocol — MUST READ FIRST

At the start of every new work session/window:

1. Read `VERSION`.
2. Read `docs/PROJECT-STATE.md`.
3. Read this `docs/ROADMAP.md`.
4. Verify the current `main` SHA and open PRs before modifying anything.
5. If the task touches deployment/runtime, verify the relevant GitHub Actions / Pages / Worker state instead of trusting an earlier chat message.
6. Continue from **Next canonical action** in `PROJECT-STATE.md`, unless the user explicitly changes priority.

At the end of every merged slice:

1. update `VERSION` if the runtime changed;
2. update `docs/PROJECT-STATE.md` with the real state;
3. update this roadmap if sequencing/status changed;
4. keep README as a short entry point only;
5. record exact merge/main SHA and QA status;
6. never write `VERIFIED PROD` without real production QA evidence.

### Non-negotiable rules

- **Repo > chat memory.**
- **One active slice at a time.**
- **Human-in-the-loop stays canonical.** IA/heuristics may propose; Trân decides before canonical/destructive writes.
- **No deployment claims without proof.** `MERGED`, `PAGES DEPLOYED`, `WORKER DEPLOYED` and `VERIFIED PROD` are different states.
- **Offline-first behavior is part of the product contract.**
- **No automatic wear event may be inferred from opening, sharing, favoriting or editing an Outfit.**

---

## 1. Closed foundations

### V0.1 — Local Closet ✅ CLOSED

- installable PWA;
- offline shell;
- IndexedDB;
- local CRUD;
- compressed photos;
- search / filters / favorites;
- JSON backup.

### V0.2 — Airtable Bridge ✅ CLOSED / VERIFIED PROD

- canonical Airtable storage;
- secured Cloudflare Worker;
- offline create/update/delete queue;
- idempotency + anti-resurrection;
- real CREATE + photo / UPDATE / DELETE round-trip verified.

### V0.3 — Outfits ✅ CLOSED / VERIFIED PROD

- offline-first Outfit Core;
- scalable 100+ item picker;
- Airtable persistence with linked records;
- separate Outfit mutation queue;
- full-screen Lookbook;
- 1080×1350 PNG + Web Share;
- CRUD / snapshot / anti-resurrection verified.

### V0.4 — Smart Closet ✅ CLOSED / VERIFIED PROD

#### V0.4-A — Assisted photo analysis ✅
- real vision pipeline;
- multi-pass / rescue / retry;
- enriched categories and colors;
- reliability indicators;
- human validation before applying.

#### V0.4-B — Duplicate Guard ✅
- perceptual similarity + metadata;
- warn / cancel / explicit bypass;
- no automatic merge/delete;
- real QA + anti-resurrection verified.

#### V0.4-C — Smart Tags ✅
- 22 canonical tags;
- editable/searchable tags;
- explainable AI suggestions;
- PWA → Worker → Airtable → snapshot round-trip verified.

---

## 2. V0.5 — Assistant generation

### V0.5-A — `Hôm nay mặc gì?` ✅ OPERATIONAL

Current capabilities:

- weather-aware Daily Assistant using Open-Meteo;
- TP. Hồ Chí Minh default + manual city + explicit geolocation;
- occasion-aware ranking;
- existing Outfit ranking and generated look candidates;
- contextual shoes / bag / headwear / umbrella;
- Smart Tags, styles, colors and favorites as signals;
- exclusion of underwear/swimwear/lenses/socks from automatic outfit assembly;
- explicit save only;
- FR / VI UI;
- live canonical clothing + Outfit convergence;
- exact deployed build identification through `build-info.json`.

---

# 3. V0.5.16 — Consolidation & Hardening ✅ CLOSED / VERIFIED PROD

Goal achieved: the previously working-but-layered product is now a clean, resumable and regression-tested base for new product work.

## Slice 16.0 — Canonical documentation & continuation protocol ✅

- canonical `PROJECT-STATE.md` + `ROADMAP.md` recovery order;
- explicit verification vocabulary;
- repo-over-chat rule.

## Slice 16.1 — GitHub hygiene ✅

- obsolete recovery PR closed;
- historical branches audited/cleaned;
- stale open-PR inventory cleared.

## Slice 16.2 — Live Outfit sync parity ✅ VERIFIED PROD

Engineering:

- Worker `GET /v1/outfits`;
- live hydration / visible polling;
- pending mutation + tombstone protection;
- focus/pageshow convergence;
- UI refresh via `tran:outfits-live-changed`, no page reload.

Final production proof:

- `OUTFIT CREATE AUTO PASS`;
- `OUTFIT UPDATE AUTO PASS`;
- `OUTFIT DELETE AUTO PASS`;
- cross-device convergence without manual refresh/sync;
- no observed resurrection.

## Slice 16.3 — Outfit integrity / incomplete state ✅ VERIFIED PROD

- fewer than 2 resolved linked clothing items => incomplete;
- no auto-delete/repair;
- bilingual warning;
- share suppressed until repaired;
- edit/favorite/delete retained;
- incomplete saved Outfit excluded from Daily Assistant complete-look ranking;
- `INCOMPLETE OUTFIT PASS` on the real `Lookbook Test` lifecycle case.

## Slice 16.4 — Runtime consolidation ✅ VERIFIED PROD

Canonical controllers replaced the version-named hotfix chain:

- `app-refresh.js`;
- `closet-search-core.mjs` + `closet-search.js`;
- `photo-picker.js`;
- `manual-sync.js`;
- keyed i18n integration.

Final mobile QA included stable navigation, Profile, uninterrupted search and Camera/Gallery.

## Slice 16.5 — i18n architecture cleanup ✅ VERIFIED PROD

- `i18n-keyed.mjs` canonical VI/FR API;
- dynamic high-risk surfaces use render-time keys/parameters;
- Daily Assistant and Duplicate Guard use structured reason descriptors;
- Photo AI semantic text is requested in active language;
- recursive body-wide translation observer removed;
- `STATIC QA PASS` covered FR↔VI migrated surfaces without observed leakage.

## Slice 16.6 — Version / cache normalization ✅ VERIFIED PROD

- `VERSION` is the release identity source;
- Pages generates exact `build-info.json`;
- Service Worker cache identity derives from version + short SHA;
- `updateViaCache:'none'`;
- release-reference normalization + cache/app-shell drift tests.

Installed production use remained stable through the closeout matrix.

## Slice 16.7 — CI consolidation + browser smoke ✅

- 14 → **9** current PR validation workflows;
- deterministic system-Chrome smoke;
- boot/search/Add/Profile/Outfits/Daily Assistant/FR↔VI coverage;
- page exceptions and failed local assets are fatal.

## Slice 16.8 — Canonical taxonomy unification ✅

Single source: `shared/taxonomy.json`.

- **17 categories**;
- **24 colors**;
- **6 styles**;
- **22 tags**;
- exact VI/FR labels;
- intentional Airtable `Swimware ` compatibility alias.

Worker deployment identity verified during closeout as `v059 / canonical-v1 / 17-24-6-22`.

## Slice 16.9 — Repository / deployment governance ✅

- only Airtable snapshot + branding generation retain permanent generated-content write authority;
- shared generated-main concurrency + collision-safe normal-push helper;
- no force-push or workflow self-mutation allowed by governance CI;
- factual branch-protection state remains **unprotected**.

## Slice 16.10 — Branding source cleanup ✅

- exactly four approved branding masters retained;
- retired intermediates removed;
- source bytes locked;
- deterministic icon regeneration guarded by CI.

## Slice 16.11 — End-to-end closeout ✅ CLOSED / VERIFIED PROD

Production QA passed:

- clothing CREATE / UPDATE / DELETE / live cross-device reread;
- Outfit CREATE / UPDATE / DELETE / live cross-device reread without manual refresh;
- incomplete Outfit warning / no auto-delete / Daily Assistant exclusion;
- offline queue recovery and automatic convergence;
- Profile stability;
- FR/VI navigation;
- Camera + Gallery source choice;
- uninterrupted search typing;
- AI human-in-the-loop with no canonical save on Apply alone;
- final Profile diagnostic reported clean queues/orphans/flush state.

Final closeout baseline returned to **11 clothing / 3 Outfits / 0 pending / 0 orphaned** after disposable E2E cleanup.

Last runtime-changing merge in the tested closeout lineage: **`abc27014929f5c0bb0bb35c50af390fd50bbe36a`**.

---

# 4. V0.5-B — Wear history & rotation 🔵 ACTIVE

Goal: reduce repetition and surface under-used clothes **without forcing choices**.

## B.1 — Wear-event foundation 🔵 CURRENT

Deliver a durable, event-based model before ranking changes.

Planned contract:

- stable wear-event ID;
- explicit `wornAt` timestamp;
- optional saved `outfitId`;
- resolved `itemIds[]` snapshot for the event;
- local `createdAt` / `updatedAt` metadata as needed;
- offline-first storage in IndexedDB;
- no inferred event from view/share/favorite/edit.

Product behavior:

- manual **Worn today / Porté aujourd'hui / Đã mặc hôm nay** action on a complete saved Outfit;
- derived Outfit `last worn` and wear count;
- derived per-item wear count / last worn from event history;
- history remains reversible/editable rather than encoded as destructive counters;
- Daily Assistant ranking remains unchanged during B.1.

Acceptance:

- one explicit tap creates exactly one event;
- reload/offline persistence works;
- incomplete Outfits cannot be marked as a complete worn look without explicit repair;
- no clothing/Outfit canonical record is mutated merely to compute usage stats;
- tests cover duplicate-tap/idempotency boundary and event deletion/recompute.

## B.2 — Canonical wear-history sync

After B.1 local behavior is proven:

- dedicated canonical Worker/Airtable wear-history representation;
- separate mutation queue;
- create/delete idempotency;
- live cross-device reread;
- pending/tombstone protection;
- diagnostics and clean recovery;
- real PC ↔ phone QA before VERIFIED PROD.

## B.3 — Rotation signal in Daily Assistant

Only after canonical history is trustworthy:

- recency penalty for recently worn looks/items;
- under-used clothing boost;
- transparent/explainable reason text;
- weather/occasion/compatibility remain stronger constraints than rotation;
- favorites may influence ranking but never override hard constraints;
- no automatic save or wear logging.

## B.4 — History UX / closeout

- simple recent-wear timeline;
- undo/delete mistaken wear event;
- clear `last worn` display;
- useful empty state for new wardrobes;
- FR/VI QA;
- offline + cross-device + assistant regression matrix;
- final diagnostic clean before V0.5-B closeout.

---

# 5. Product roadmap after V0.5-B

## V0.5-C — Conversational closet assistant

Planned:

- natural questions about the real closet;
- prepare a look for a future date/occasion/weather context;
- detailed reasoning on demand;
- operate only on canonical/current wardrobe data;
- human-in-the-loop for all saved changes.

## V0.6 — Daily Driver hardening / productization

Candidate themes:

- private access/authentication strategy;
- optional notifications/reminders;
- deeper iPhone/PWA polish;
- install/update UX for VI/FR;
- backup/restore UX hardening;
- observability/recovery UX for non-technical use.

## V1.0 — Daily Driver

Target definition will be frozen only after V0.6 learnings. Minimum expectation:

- trustworthy cross-device canonical data;
- stable install/update/offline behavior;
- clean assistant workflow;
- understandable recovery/diagnostics;
- no developer intervention required for routine use.

---

# 6. Explicit deferred / backlog

- replace the photo of an already existing Airtable-backed clothing record;
- richer color nuance beyond current canonical set;
- smarter 2/3/4+ item Lookbook composition;
- optional background removal/cutout;
- richer accessory/style semantics;
- notifications;
- public/shareable links.

---

# 7. Status legend

- ✅ **CLOSED / VERIFIED PROD** — production behavior verified with real QA.
- 🟢 **OPERATIONAL** — capability exists in current product; parent phase may still be open.
- 🔵 **CURRENT / ACTIVE** — active engineering slice.
- 🟡 **MERGED / QA DEFERRED** — code is in `main`, required product proof remains.
- ⏭ **NEXT** — explicitly sequenced after current blocker/phase.
- ⏸ **DEFERRED** — deliberately postponed.
