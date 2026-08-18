# MASTER ROADMAP — Trân's Closet PWA

> **Canonical project roadmap.** This file is the source of truth for sequencing work across successive ChatGPT/Codex sessions.
>
> Current factual runtime state lives in [`PROJECT-STATE.md`](./PROJECT-STATE.md). When chat history and the repository disagree, **verify `main` and follow the repository**.

Last roadmap reset: **2026-08-18**  
Current slice: **V0.5.16 · Slice 16.1 — GitHub hygiene**

---

## 0. Session continuation protocol — MUST READ FIRST

At the start of every new work session/window:

1. Read `VERSION`.
2. Read `docs/PROJECT-STATE.md`.
3. Read this `docs/ROADMAP.md`.
4. Verify the current `main` SHA and open PRs before modifying anything.
5. If the task touches deployment/runtime, verify the relevant GitHub Actions / Pages / Worker state instead of trusting an earlier chat message.
6. Continue from **"Next canonical action"** in `PROJECT-STATE.md`, unless the user explicitly changes priority.

At the end of every merged slice:

1. update `VERSION` if the runtime changed;
2. update `docs/PROJECT-STATE.md` with the new real state;
3. update this roadmap if sequencing/status changed;
4. keep README as a short entry point only;
5. record the exact merge/main SHA and QA status;
6. never write `VERIFIED PROD` without real production QA evidence.

### Non-negotiable rules

- **Repo > chat memory.** Chat history is context, not authority.
- **One active slice at a time.** Do not stack unrelated hotfixes/features in one PR.
- **Human-in-the-loop stays canonical.** IA/heuristics may propose; Trân decides before canonical/destructive writes.
- **No deployment claims without proof.** "Merged", "CI green", "Pages deployed", "Worker deployed", and "phone QA passed" are separate states.
- **No new product phase while consolidation blockers remain open.**

---

## 1. Closed foundations

### V0.1 — Local Closet ✅
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

## 2. V0.5 — Assistant / current product generation

### V0.5-A — `Hôm nay mặc gì?` 🟢 DEPLOYED

Current capabilities already present in production:
- weather-aware daily assistant using Open-Meteo;
- TP. Hồ Chí Minh default location + manual city + explicit browser geolocation;
- occasion-aware ranking;
- existing Outfit ranking and generated look candidates;
- contextual shoes / bag / headwear / umbrella;
- Smart Tags, styles, colors and favorites as signals;
- exclusion of underwear/swimwear/lenses/socks from automatic outfit assembly;
- explicit save only;
- FR / VI interface for QA and Trân usage;
- refreshed branding / PWA identity;
- live canonical clothing sync across devices;
- stabilized profile diagnostics and exact build identification;
- safe reconciliation of stale DELETE mutations through v0.5.15.

**V0.5 is NOT closed yet.** The product works, but the implementation accumulated technical debt between v0.5.8 and v0.5.15. Consolidation comes before V0.5-B.

---

# 3. V0.5.16 — Consolidation & Hardening 🔵 ACTIVE ROADMAP

Goal: turn the currently working v0.5.15 product into a clean, resumable, testable base before adding new product features.

## Slice 16.0 — Canonical documentation & continuation protocol ✅ CLOSED

Completed by PR **#46**.

Delivered:
- `ROADMAP.md` is the cross-session master roadmap;
- `PROJECT-STATE.md` describes the audited v0.5.15 baseline and blockers;
- README points new sessions to `VERSION` → `PROJECT-STATE` → `ROADMAP`;
- stable baseline and current blockers are recorded;
- session continuation and verification vocabulary are explicit.

Exit criteria met:
- a new chat can recover the project state from the repo without relying on previous chat transcripts;
- README / PROJECT-STATE / ROADMAP now share the same continuation model.

## Slice 16.1 — GitHub hygiene 🔵 CURRENT

Deliverables:
- close obsolete PR #33 (old V0.5.7 branding recovery);
- inventory historical branches;
- delete merged/abandoned branches in controlled batches;
- retain only `main` and any genuinely active work branch;
- document branch/PR convention.

Exit criteria:
- no stale open PR;
- historical branches no longer obscure active work.

## Slice 16.2 — Live Outfit sync parity **P1**

Problem:
- clothing has live canonical reread/polling;
- Outfit writes sync live, but cross-device Outfit reads can still depend on the scheduled GitHub snapshot.

Deliverables:
- authenticated canonical `GET /v1/outfits` through the Worker;
- `syncLiveCanonicalOutfits()` client equivalent to clothing live sync;
- preserve local pending Outfit mutations during reconciliation;
- propagate remote deletes safely;
- visibility/online polling parity with clothing;
- diagnostics expose live Outfit record count and last sync/error.

Exit criteria:
- create/update/delete an Outfit on device A appears/disappears on device B without waiting for the 6-hour snapshot;
- zero duplicated Outfit IDs;
- pending local Outfit edits are never overwritten by a live reread.

## Slice 16.3 — Outfit integrity / incomplete state

Problem:
- an Outfit created with ≥2 pieces may later drop below 2 if a linked clothing record is deleted.

Deliverables:
- define canonical `incomplete` behavior without auto-deleting the Outfit;
- visibly warn when fewer than 2 linked items remain;
- exclude incomplete outfits from recommendation/ranking as complete looks;
- allow user repair/edit/delete explicitly.

Exit criteria:
- no silent invalid Outfit presented as complete;
- no destructive automatic cleanup.

## Slice 16.4 — Runtime consolidation

Problem:
- bootstrap currently loads a historical stack of versioned hotfix modules (`v059-*`, `v0510-*`, `v0512-*`, `v0513-*`, etc.).

Deliverables:
- absorb proven hotfix behavior into canonical modules;
- remove legacy patch modules once behavior is covered by tests;
- simplify bootstrap imports;
- remove obsolete compatibility markers where CI no longer needs them.

Exit criteria:
- one canonical implementation per concern;
- no hotfix-on-hotfix runtime chain;
- no regression in profile, search, photo picker, sync diagnostics, AI or assistant.

## Slice 16.5 — i18n architecture cleanup

Problem:
- current FR/VI translation relies heavily on exact DOM text replacement plus later hotfixes.

Deliverables:
- introduce key-based translations (`t('...')`) for canonical UI rendering;
- move dynamic messages to translation keys with parameters;
- preserve Vietnamese default and persistent FR QA mode;
- retire mutation-based translation patches once migrated.

Exit criteria:
- no Vietnamese leakage in FR mode for covered product surfaces;
- no DOM-observer translation loops;
- FR ↔ VI switch remains persistent and safe.

## Slice 16.6 — Version / cache normalization

Problem:
- runtime is v0.5.15 while service-worker cache and many asset query strings still carry historical v0.5.1…v0.5.15 labels.

Deliverables:
- define one build/version source derived from `VERSION`/build metadata;
- normalize Service Worker cache namespace/versioning;
- remove stale hard-coded cache-bust versions where possible;
- preserve `build-info.json` as exact deployment proof.

Exit criteria:
- no ambiguous "v0.5.1 cache serving v0.5.15 runtime" state;
- update behavior remains safe on installed iOS/Android PWAs.

## Slice 16.7 — CI consolidation + browser smoke

Problem:
- many historical version-specific workflows protect strings/files rather than final user behavior.

Deliverables:
- consolidate useful regression checks into maintainable suites;
- remove redundant version-specific gates after equivalent coverage exists;
- add a lightweight browser smoke (Playwright or equivalent) for critical routes/actions:
  - app boot;
  - Dressing navigation/search;
  - Add + gallery/photo controls;
  - Profile open/diagnostics;
  - FR/VI switch;
  - Assistant open;
  - Outfit route/picker.

Exit criteria:
- CI tests product behavior instead of historical implementation details;
- the Profile crash class is caught automatically.

## Slice 16.8 — Canonical taxonomy unification

Problem:
- categories/colors/styles/tags exist in multiple client/Worker/versioned definitions and can drift from Airtable choices.

Deliverables:
- one canonical taxonomy source;
- client and Worker consume generated/shared definitions where practical;
- CI validates Airtable-compatible values and mappings;
- normalize known legacy spelling/spacing quirks without destructive migration.

Exit criteria:
- adding a future color/category requires one intentional source change, not several scattered edits.

## Slice 16.9 — Repository / deployment governance

Deliverables:
- protect `main` where compatible with the project workflow;
- define required checks for feature PRs;
- review workflows that commit generated snapshots/assets directly to `main`;
- keep Airtable snapshots as fallback/offline artifacts without letting automated commits surprise active development;
- document what constitutes merge / deployed / verified-prod.

Exit criteria:
- accidental direct writes cannot bypass the project gates;
- automation does not create hidden project-state divergence.

## Slice 16.10 — Branding source cleanup

Deliverables:
- identify canonical current favicon/header/logo/splash masters;
- remove obsolete cream/round branding sources only after dependency search;
- keep deterministic system-icon generation;
- ensure no workflow can resurrect retired branding.

Exit criteria:
- one understandable branding source-of-truth set;
- current visual identity unchanged.

## Slice 16.11 — V0.5.16 end-to-end closeout

Required QA:
- Android + iPhone install/open/update sanity;
- clothing CREATE / UPDATE / DELETE / live cross-device reread;
- Outfit CREATE / UPDATE / DELETE / live cross-device reread;
- offline queue recovery;
- Profile diagnostics stable;
- FR/VI switch stable;
- photo/gallery path stable;
- AI suggestion still human-in-the-loop;
- Daily Assistant still produces context-aware suggestions;
- PWA icon/splash/header remain correct;
- diagnostics end with no unexpected pending mutations/orphans.

Close only when:
- CI consolidated and green;
- Pages/Worker state verified where changed;
- phone QA passes;
- `PROJECT-STATE.md` records the exact final SHA and baseline.

---

# 4. Product roadmap after consolidation

## V0.5-B — Wear history & rotation ⏭ AFTER V0.5.16

Goal: reduce repetition without forcing choices.

Planned:
- outfit wear history;
- `last worn` timestamp;
- wear count / under-used clothing signals;
- manual "worn today" action;
- rotation signal added to Daily Assistant ranking;
- no automatic canonical decision on behalf of Trân.

## V0.5-C — Conversational closet assistant

Planned:
- natural questions about the real closet;
- prepare a look for a future date/occasion/weather context;
- detailed reasoning on demand;
- operate only on canonical/current wardrobe data;
- human-in-the-loop for all saved changes.

## V0.6 — Daily Driver hardening / productization

Candidate themes after V0.5 is closed:
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

# 5. Explicit deferred/backlog — not blockers for V0.5.16 unless promoted

- replace the photo of an already existing Airtable-backed clothing record;
- richer color nuance beyond current canonical set;
- smarter 2/3/4+ item Lookbook composition;
- optional background removal/cutout for clothing presentation;
- richer accessory/style semantics;
- notifications;
- public/shareable links (current sharing remains local image/file oriented).

---

# 6. Status legend

- ✅ **CLOSED / VERIFIED PROD** — production behavior verified with real QA.
- 🟢 **DEPLOYED / operational** — present in production; parent phase may still be open.
- 🔵 **ACTIVE ROADMAP** — current engineering phase/slice.
- 🟡 **CANDIDATE** — implemented/deployed but required QA incomplete.
- ⏭ **NEXT** — explicitly sequenced after current blockers/phase.
- ⏸ **DEFERRED** — deliberately postponed; do not pull into active work casually.
