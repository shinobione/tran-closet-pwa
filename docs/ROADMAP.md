# MASTER ROADMAP — Trân's Closet PWA

> **Canonical project roadmap.** This file is the source of truth for sequencing work across successive ChatGPT/Codex sessions.
>
> Current factual runtime state lives in [`PROJECT-STATE.md`](./PROJECT-STATE.md). When chat history and the repository disagree, **verify `main` and follow the repository**.

Last roadmap update: **2026-08-19**  
Current slice: **V0.5.16 · Slice 16.10 — branding source cleanup**

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

### V0.5-A — `Hôm nay mặc gì?` 🟢 OPERATIONAL

Current capabilities already present:
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

**V0.5 is NOT closed yet.** Consolidation must finish before V0.5-B.

---

# 3. V0.5.16 — Consolidation & Hardening 🔵 ACTIVE ROADMAP

Goal: turn the working product into a clean, resumable, testable base before adding new product features.

## Slice 16.0 — Canonical documentation & continuation protocol ✅ CLOSED

Completed by PR **#46**.

Delivered:
- `ROADMAP.md` is the cross-session master roadmap;
- `PROJECT-STATE.md` describes factual state and blockers;
- README points new sessions to `VERSION` → `PROJECT-STATE` → `ROADMAP`;
- continuation and verification vocabulary are explicit.

## Slice 16.1 — GitHub hygiene ✅ CLOSED

Completed on **2026-08-19**.

Delivered:
- obsolete branding recovery PR **#33** closed without merge;
- historical branch inventory audited and cleaned through a one-shot runner;
- cleanup runner removed itself after execution;
- stale open-PR inventory cleared at closeout.

Governance/protection itself remains Slice 16.9.

## Slice 16.2 — Live Outfit sync parity 🟡 ENGINEERING MERGED

Initial implementation: PR **#49**, runtime merge **`183a2650f1cfe95320bb6fde9c3d9768ea31f07c`**.

Real PC ↔ phone QA then proved:
- Worker/auth/queues/canonical reread were healthy;
- remote create/delete were visible after manual page refresh;
- visible UI did not reliably auto-converge.

Follow-up: PR **#50**, merge **`6ed2bcd345fcaf8c98ba03abdad9ad876ee6a21f`**.

Delivered:
- authenticated canonical `GET /v1/outfits` through the Worker;
- live Outfit hydration/polling;
- pending local Outfit mutation protection;
- remote delete propagation + tombstone protection;
- diagnostics for live Outfit count / timestamp / error;
- `focus` + `pageshow` foreground checks;
- UI convergence through `tran:outfits-live-changed` without `location.reload()`;
- behavior-focused regression tests.

**Status:** engineering merged and CI green. A strict post-#50 two-device create/update/delete auto-convergence pass was not recorded before the user elected to continue consolidation. Do **not** label this VERIFIED PROD yet; final proof is carried into Slice 16.11.

## Slice 16.3 — Outfit integrity / incomplete state 🟡 MERGED / CI GREEN

PR **#51**, squash merge **`f3cf862d94c7186773a35f0fca511838d68bd5d8`**.

Delivered:
- canonical derived `complete` / `incomplete` behavior;
- fewer than 2 **resolved** linked clothing items => `incomplete`;
- no automatic delete/write/repair;
- explicit FR/VI warning + resolved count;
- edit/favorite/delete stay available;
- incomplete Outfit is not presented as share-ready complete Lookbook;
- incomplete saved Outfits are excluded from Daily Assistant complete-look ranking;
- tests cover missing linked items and the important one-piece-garment edge case.

Real lifecycle case: `Lookbook Test` previously had only `Melody Bag` linked.

**Status:** merged / CI green. Production UI/device verification is carried into Slice 16.11.

## Slice 16.4 — Runtime consolidation 🟡 MERGED / 12/12 CI GREEN

PR **#52**, squash merge **`082487fc938bbbed47e37a00727a23989a58a99b`** after **12/12 PR workflows SUCCESS**.

Delivered canonical runtime controllers:
- `app-refresh.js` — one external canonical-data refresh adapter;
- `closet-search-core.mjs` + `closet-search.js` — accent-insensitive VI/FR search without recreating the focused field;
- `photo-picker.js` — explicit Camera + Gallery source picker;
- `manual-sync.js` — clothing + Outfit queue flush without browser reload;
- `i18n-runtime-compat.js` — one transitional dynamic compatibility layer pending Slice 16.5.

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

Historical workflow filenames remain temporarily but relevant checks now target canonical modules. CI workflow-name consolidation itself remains 16.7.

**Status:** merged / 12-of-12 PR CI green. Final browser/device regression QA is carried into Slice 16.11.

## Slice 16.5 — i18n architecture cleanup 🟡 MERGED / CI GREEN

PRs **#54**, **#55** and **#56** delivered the architecture migration. Final runtime merge for 16.5C: **`536e7157793e2fc5d237656fc98ebd98ba633b7f`**.

Delivered:
- `i18n-keyed.mjs` as the canonical VI/FR keyed translation API;
- high-risk dynamic surfaces migrated to render-time keys and parameters;
- Daily Assistant + Duplicate Guard reason descriptors instead of Vietnamese text matching;
- Outfit Picker and targeted legacy `app.js` output migrated;
- Photo AI deterministic UI keyed, with Worker semantic explanations generated in the requested FR/VI language;
- `i18n-runtime-compat.js` deleted;
- global recursive `i18n.js` DOM observer removed;
- remaining legacy static route/dialog/toast translation bounded behind explicit app render sinks;
- final PR #56 passed **12/12** PR workflows.

**Status:** engineering merged / CI green. Final browser/device FR↔VI leakage QA is carried into Slice 16.11; do not label VERIFIED PROD yet.

## Slice 16.6 — Version / cache normalization 🟡 MERGED / 14/14 CI GREEN

PR **#58**, tested head **`5259ec530988c2ffa6febd6d4666f68fa920216d`**, squash merge **`1bb94d173d6ae1ad7a7833063a0fe45542a7ec80`**.

Delivered:
- exact cache namespace from deployed version + short SHA;
- VERSION-driven runtime cache-bust references and manifest icons;
- source/offline fallback identity from `VERSION`;
- `updateViaCache:'none'` for Service Worker registration;
- permanent release-ref normalizer + exact cache/app-shell coherence tests;
- Pages preflight before exact `build-info.json`;
- cache namespace isolation preserved;
- historical v058/v059/v0510 + global PWA gates retargeted away from hard-coded release labels;
- final contract: **108 release refs**, **59 app-shell entries**, **14/14 PR workflows SUCCESS**.

**Status:** engineering merged / CI green. Installed iOS/Android update/cache verification remains in Slice 16.11; do not label VERIFIED PROD yet.

## Slice 16.7 — CI consolidation + browser smoke ✅ MERGED / 9/9 GREEN

PR **#60**, tested head **`845ffa7f9aa56f28a7e09160a85dd803dda4a45a`**, squash merge **`19b32a12de6752b5b610e502789c22f27e2a225d`**.

Delivered:
- 14 → **9** PR validation workflows;
- current domain suites for UI/Profile and Sync/Delete contracts;
- topology guard forbidding 8 retired historical gates;
- documented CI ownership map;
- deterministic Playwright smoke using system Chrome;
- real-browser coverage for boot, search focus, Add/photo source choice, Profile/diagnostics, Outfits, Daily Assistant and FR↔VI rendering;
- page exceptions and failed local script/style loads are fatal;
- external weather/Worker/build endpoints are stubbed and no canonical write occurs;
- final head passed **9/9** workflows including the browser smoke.

**Status:** merged / CI + deterministic browser smoke green. This does not replace installed-device/Pages verification in Slice 16.11.

## Slice 16.8 — Canonical taxonomy unification 🟡 MERGED / 9/9 GREEN

PR **#62**, tested head **`35d1711f480d5e711462d442d2dcfd9b44249c78`**, squash merge **`f748d0b62bc4f610009eee886d7c5e5689c80477`**.

Delivered:
- one canonical repository taxonomy source: **17 categories / 24 colors / 6 styles / 22 tags** + exact VI/FR labels;
- deterministic generated client + Worker modules and drift detection;
- base Worker AI schema aligned to the full client/fine-color taxonomy;
- explicit Airtable `Swimware ` storage compatibility alias with round-trip tests, no destructive rename;
- snapshot taxonomy validation fails closed on unknown Airtable select/multi-select values;
- Worker deploy taxonomy preflight;
- Daily Assistant policy subsets proven to reference canonical values;
- taxonomy parity owned by existing global + UI/Profile suites, keeping the **9-workflow** CI topology;
- final **9/9** PR workflows and browser smoke green.

**Status:** engineering merged / CI green. No canonical data migration. Worker deployment state must be independently proven when needed.

## Slice 16.9 — Repository / deployment governance ✅ MERGED / 9/9 GREEN

PR **#64**, tested head **`4927f447227991b23dc48d4e6b8923176dc0a433`**, squash merge **`a1689d14548c4ecbffe2e4b526d6db655f546ead`**.

Delivered:
- explicit repository governance and deployment vocabulary;
- factual `main` protection state documented as unprotected;
- only Airtable snapshot + branding generation retain permanent generated-content write authority;
- shared generated-main concurrency and collision-safe latest-main regeneration helper;
- no force-push or workflow self-mutation allowed by governance tests;
- **17** stale/no-op/merged branches removed through exact-head fail-closed audit;
- snapshot automation moved `main` during the PR and the candidate still validated against the updated merge ref;
- browser smoke was strengthened and exposed the real startup `syncNow(true)` search-focus regression;
- silent startup/online sync now defers route rerender while the search field is focused, resuming on blur;
- final hardened Chrome proof validates two-batch typing without refocus;
- final **9/9** PR validation workflows + branding generator SUCCESS.

**Status:** engineering/governance merged. `main` branch protection is not claimed enabled; Pages/Worker/installed-device VERIFIED PROD remain separate.

## Slice 16.10 — Branding source cleanup 🔵 CURRENT

Deliverables:
- identify canonical favicon/header/logo/splash masters;
- remove obsolete branding sources after dependency search;
- keep deterministic icon generation;
- ensure no workflow can resurrect retired branding.

Current visual identity must not change during this cleanup.

## Slice 16.11 — V0.5.16 end-to-end closeout

Required QA accumulates deferred production/device proof from 16.2–16.6 plus Worker deployment proof affected by 16.8, installed-device search/sync proof affected by 16.9, and the final consolidated-runtime verification:
- Android + iPhone install/open/update sanity;
- clothing CREATE / UPDATE / DELETE / live cross-device reread;
- Outfit CREATE / UPDATE / DELETE / live cross-device reread **without manual refresh**;
- incomplete Outfit warning / repair/delete behavior;
- offline queue recovery;
- Profile diagnostics stable;
- FR/VI switch stable with no migrated-surface language leakage;
- photo Camera + Gallery path stable;
- search typing remains uninterrupted;
- manual sync remains stable and does not reload the browser unexpectedly;
- AI suggestion still human-in-the-loop;
- Daily Assistant still produces context-aware suggestions and excludes incomplete saved Outfits;
- PWA icon/splash/header remain correct;
- diagnostics end with no unexpected pending mutations/orphans.

Close only when:
- consolidated CI is green;
- Pages/Worker state is verified where changed;
- phone QA passes;
- `PROJECT-STATE.md` records exact final runtime SHA and baseline.

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

# 5. Explicit deferred/backlog

- replace the photo of an already existing Airtable-backed clothing record;
- richer color nuance beyond current canonical set;
- smarter 2/3/4+ item Lookbook composition;
- optional background removal/cutout;
- richer accessory/style semantics;
- notifications;
- public/shareable links.

---

# 6. Status legend

- ✅ **CLOSED / VERIFIED PROD** — production behavior verified with real QA.
- 🟢 **OPERATIONAL** — capability exists in current product; parent phase may still be open.
- 🔵 **CURRENT / ACTIVE** — active engineering slice.
- 🟡 **MERGED / QA DEFERRED** — code is in `main`, required product proof remains for 16.11.
- ⏭ **NEXT** — explicitly sequenced after current blockers/phase.
- ⏸ **DEFERRED** — deliberately postponed.
