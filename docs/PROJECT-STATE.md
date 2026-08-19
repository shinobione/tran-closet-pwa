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
- current runtime-changing main SHA: **`c13f2e380fd2228375372e31ead06537f647deb1`** — Slice 16.10 canonical branding source cleanup
- PWA: `https://shinobione.github.io/tran-closet-pwa/`
- Cloudflare Worker: `https://tran-closet-sync.jerryquinet.workers.dev`
- IndexedDB: `tran-closet`, schema version **4**
- Worker entrypoint configured by `worker/wrangler.toml`: `src/v059.js`

Important recent runtime lineage:
- Slice 16.2 initial live Outfit parity: PR **#49**, merge/runtime **`183a2650f1cfe95320bb6fde9c3d9768ea31f07c`**;
- Slice 16.2 visible UI convergence follow-up: PR **#50**, merge **`6ed2bcd345fcaf8c98ba03abdad9ad876ee6a21f`**;
- Slice 16.3 incomplete Outfit integrity: PR **#51**, squash merge **`f3cf862d94c7186773a35f0fca511838d68bd5d8`**;
- Slice 16.4 runtime consolidation: PR **#52**, squash merge **`082487fc938bbbed47e37a00727a23989a58a99b`** after **12/12 PR workflows SUCCESS**;
- Slice 16.5A keyed i18n foundation: PR **#54**, merge **`add11b112482a3718784b27969e0c0aa84200693`** after **13/13 PR workflows SUCCESS**;
- Slice 16.5B runtime compat bridge retirement: PR **#55**, merge **`128671489d95177592305d1456e463cd4e24d697`** after **13/13 PR workflows SUCCESS**;
- Slice 16.5C dynamic i18n closeout: PR **#56**, squash merge **`536e7157793e2fc5d237656fc98ebd98ba633b7f`** after **12/12 final PR workflows SUCCESS**;
- Slice 16.6 version/cache normalization: PR **#58**, tested head **`5259ec530988c2ffa6febd6d4666f68fa920216d`**, squash merge **`1bb94d173d6ae1ad7a7833063a0fe45542a7ec80`** after **14/14 PR workflows SUCCESS**.
- Slice 16.7 CI consolidation + browser smoke: PR **#60**, tested head **`845ffa7f9aa56f28a7e09160a85dd803dda4a45a`**, squash merge **`19b32a12de6752b5b610e502789c22f27e2a225d`** after **9/9 final PR workflows SUCCESS**; real system-Chrome smoke passed both deterministic browser scenarios.
- Slice 16.8 canonical taxonomy unification: PR **#62**, tested head **`35d1711f480d5e711462d442d2dcfd9b44249c78`**, squash merge **`f748d0b62bc4f610009eee886d7c5e5689c80477`** after **9/9 PR workflows SUCCESS**; canonical taxonomy **17 categories / 24 colors / 6 styles / 22 tags**, client=Worker, Airtable alias round-trip and system-Chrome smoke PASS.
- Slice 16.9 repository/deployment governance: PR **#64**, tested head **`4927f447227991b23dc48d4e6b8923176dc0a433`**, squash merge **`a1689d14548c4ecbffe2e4b526d6db655f546ead`** after **9/9 PR validations SUCCESS** + branding generator SUCCESS; 17 stale branches removed, generated-main writers hardened, and the startup silent-sync search focus regression fixed with hardened Chrome proof.
- Slice 16.10 canonical branding source cleanup: PR **#66**, tested head **`ae852dd88ce9fdb33304b04fbdf323f0bbda7d5d`**, squash merge **`c13f2e380fd2228375372e31ead06537f647deb1`** after **9/9 PR validations SUCCESS + Generate brand assets SUCCESS**; four approved masters byte-locked, four obsolete intermediates removed, Pillow 12.3.0 pinned, generated icons zero-diff and Chrome branding wiring PASS.

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
  - **16.5 i18n architecture cleanup:** 🟡 MERGED / CI GREEN; final FR↔VI browser/device QA deferred to Slice 16.11.
  - **16.6 version/cache normalization:** 🟡 MERGED / 14/14 CI GREEN; installed-device update/cache QA deferred to Slice 16.11.
  - **16.7 CI consolidation + browser smoke:** ✅ MERGED / 9/9 CI + BROWSER SMOKE GREEN.
  - **16.8 taxonomy unification:** 🟡 MERGED / 9/9 CI + BROWSER SMOKE GREEN; Worker deployment proof not inferred from merge.
  - **16.9 repo/deployment governance:** ✅ MERGED / 9/9 CI + BROWSER SMOKE GREEN; governance contract recorded, `main` protection state remains explicitly unprotected.
  - **16.10 branding source cleanup:** ✅ MERGED / 9/9 CI + BRANDING GENERATOR + BROWSER SMOKE GREEN; installed-device visual/cache proof deferred to 16.11.
  - **16.11 end-to-end closeout:** 🔵 CURRENT FINAL SLICE
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

Search and photo controllers no longer use subtree observers. The transitional `i18n-runtime-compat.js` introduced in 16.4 was removed in Slice 16.5; dynamic Assistant, Duplicate, Outfit and app copy now use keyed or explicit translation sinks rather than a global recursive translation observer.

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

### 16.5 — i18n architecture — MERGED / CI GREEN

Delivered across PRs #54, #55 and #56:
- canonical `i18n-keyed.mjs` with VI/FR keys, parameters and persistent language selection;
- keyed rendering for search, photo, manual sync, Profile diagnostics/build info, Outfit integrity/presentation/picker, Daily Assistant, Duplicate Guard and Photo AI;
- Daily Assistant and Duplicate Guard reasoning converted from rendered Vietnamese sentences to structured translation descriptors;
- Photo AI sends the active language to the Worker and free-form `reason` / `tagReason` are generated in that requested language;
- `i18n-runtime-compat.js` physically removed from runtime and offline shell;
- body-wide recursive translation `MutationObserver` removed from legacy `i18n.js`;
- remaining static legacy route/dialog/toast translation uses explicit bounded sinks from `app.js`;
- final PR #56 passed **12/12** PR workflows on its tested head before merge.

Final FR↔VI device/browser leakage verification remains part of Slice 16.11, so this is not yet VERIFIED PROD.

### 16.6 — PWA cache/version normalization — MERGED / 14/14 CI GREEN

Delivered by PR **#58**:
- Service Worker cache identity derives from deployed `build-info.json` as `tran-closet-<version>-<shortSha>`;
- `VERSION` is the source/offline fallback identity and drives runtime `?v=` cache-bust references;
- the historical static `tran-closet-v0.5.1` namespace is retired;
- Service Worker registration uses `updateViaCache:'none'`;
- `scripts/normalize-release-refs.mjs` detects/writes release-ref drift across HTML, manifest, SW, JS and CSS;
- `scripts/test-version-cache.mjs` validates build identity, manifest/bootstrap/app-shell coherence and fallback versions;
- PWA cache isolation still deletes only stale `tran-closet-*` caches, never unrelated origin caches;
- Pages runs version/cache preflight before generating exact `build-info.json`;
- historical v058/v059/v0510 gates now derive runtime references from `VERSION`;
- final dedicated contract reported **108 release refs** and **59 app-shell entries** coherent for `v0.5.16`;
- final tested head **`5259ec530988c2ffa6febd6d4666f68fa920216d`** passed **14/14** PR workflows before merge.

Installed iOS/Android update/cache behavior remains part of Slice 16.11, so this is not yet VERIFIED PROD.

### 16.7 — CI consolidation + browser smoke — MERGED / 9/9 GREEN

Delivered by PR **#60**:
- PR validation topology reduced from **14 historical/version-specific workflows to 9 current domain validators**;
- V0.5.8/V0.5.9/Profile/French-AI checks consolidated into `validate-ui-profile-contracts.yml`;
- manual-sync/delete/CORS reread checks consolidated into `validate-sync-delete-contracts.yml`;
- standalone PWA-isolation workflow retired while the isolation test remains executed by global PWA + version/cache validation;
- `scripts/test-ci-topology.mjs` prevents resurrection of 8 retired gates and protects the required 9-workflow topology;
- `docs/CI-COVERAGE.md` records current ownership and browser-smoke policy;
- Playwright browser smoke drives the preinstalled system Chrome against a local static server;
- deterministic smoke covers FR boot, uninterrupted search typing/focus, Add + Camera/Gallery, Profile + diagnostics, Outfits, Daily Assistant with stubbed weather, FR→VI reload, and page-level exception/local asset failure detection;
- smoke carries no sync token, stubs external network dependencies and performs no canonical write;
- final tested head **`845ffa7f9aa56f28a7e09160a85dd803dda4a45a`** passed **9/9** PR workflows before squash merge **`19b32a12de6752b5b610e502789c22f27e2a225d`**.

This is deterministic browser regression proof, not Pages deployment or installed-device VERIFIED PROD. Device/deployment proof remains in Slice 16.11.

### 16.8 — canonical taxonomy unification — MERGED / 9/9 GREEN

Delivered by PR **#62**:
- `shared/taxonomy.json` is the single repository source for **17 categories / 24 colors / 6 styles / 22 tags** plus exact VI/FR labels;
- deterministic generated client + Worker modules are checked for drift;
- base Worker AI schema now consumes the same 24-color taxonomy exposed by the client/fine-color layer;
- fine-color Worker consumes canonical colors rather than redefining them;
- legacy runtime values such as `Accessorie`, `Swimware` and `Eye Lens` remain unchanged;
- historical Airtable storage alias `Swimware → "Swimware "` is explicit and round-trip tested;
- snapshot generation fails closed on unknown Airtable category/color/style/tag values before writing the checked-in fallback;
- Worker deployment validates taxonomy parity before Wrangler deployment and reacts to canonical taxonomy source/generator/test changes;
- Daily Assistant semantic role/occasion/weather subsets remain policy layers but are tested to reference only canonical categories/colors/styles/tags;
- generated client taxonomy is part of the Service Worker shell;
- CI topology remains 9 workflows; global PWA + UI/Profile own taxonomy parity;
- final tested head **`35d1711f480d5e711462d442d2dcfd9b44249c78`** passed **9/9** PR workflows including system-Chrome smoke before squash merge **`f748d0b62bc4f610009eee886d7c5e5689c80477`**.

No Airtable record or canonical user data was migrated by the engineering PR. Merge does not prove that the Worker deployment completed; deployment proof remains separate.

### 16.9 — repo / deployment governance — MERGED / 9/9 GREEN

Delivered by PR **#64**:
- repository governance vocabulary separates MERGED / PAGES DEPLOYED / WORKER DEPLOYED / VERIFIED PROD;
- current `main` protection state is recorded factually as unprotected rather than falsely claimed enabled;
- permanent generated-content writers are restricted to Airtable snapshot sync + branding generation;
- both generated writers share `generated-main-writes` concurrency and use `scripts/commit-generated-artifacts.sh`;
- generated writes always restart from latest `origin/main`, commit only allowlisted generated paths, never force-push and retry normal push races;
- governance CI rejects extra `contents: write` writers, direct/force generated pushes and workflow self-mutation;
- audited fail-closed cleanup removed **17** stale/no-op/merged branches; after cleanup the repo had only `main` + the active governance branch;
- scheduled Airtable snapshot movement advanced `main` during PR #64 and the candidate was tested successfully against the updated merge ref;
- hardened Chrome smoke exposed a real pre-existing startup search-focus loss caused by `setTimeout(()=>syncNow(true),700)` rerendering the route while typing;
- startup and `online` silent sync now use `syncWhenSearchIdle()`, deferring rerender until search blur instead of forced refocus;
- hardened browser proof types `Melo`, pauses 250 ms, then types `dy` without another click and requires `Melody`;
- final tested head **`4927f447227991b23dc48d4e6b8923176dc0a433`** passed **9/9** PR validations plus branding generation before squash merge **`a1689d14548c4ecbffe2e4b526d6db655f546ead`**.

Branch protection/ruleset was not enabled: the available connector does not expose a safe mutation while preserving the two legitimate generated-main writers. This is documented governance, not an unverified claim. Final installed-device search/sync behavior remains part of Slice 16.11.

### 16.10 — canonical branding source cleanup — MERGED / STRICT GREEN

Delivered by PR **#66**:
- `branding/` now contains exactly four approved visual masters: favicon source, header lockup, hero logo mark and iOS splash;
- all four masters are byte-locked by exact Git blob SHA in `scripts/test-branding-sources.mjs`;
- four historical/intermediate branding sources were removed after dependency audit; exact retired filenames remain documented only in `docs/BRANDING-SOURCES.md`, the intentional audit-history allowlist;
- strict source guard scans tracked files for retired path/basename references and verifies HTML/CSS/Service Worker/generator wiring;
- favicon generation keeps decoded source SHA-256 `b0a52f01ae3679515abc10caf1db3a331a49ab57d85928ed3a007696a1f8eb3d`;
- Python remains 3.12 and Pillow is pinned to **12.3.0**, the exact version proven by the last successful pre-cleanup generator run;
- PR generation regenerates `favicon.ico` + all `icons/*` outputs and requires zero diff;
- real Chrome smoke verifies the canonical header actually loads, the hero uses `logo-mark-v057.png`, the iOS splash remains wired, and the hardened two-batch search proof stays green;
- final tested head **`ae852dd88ce9fdb33304b04fbdf323f0bbda7d5d`** passed **9/9** primary PR validations plus **Generate brand assets SUCCESS** before squash merge **`c13f2e380fd2228375372e31ead06537f647deb1`**.

No approved visual master was redesigned/recolored/recropped, and no canonical user/Airtable data or Worker behavior changed. Installed-device cache/visual confirmation remains part of Slice 16.11.

### Deferred production proof

Because the user explicitly asked engineering work to continue, strict product QA for 16.2/16.3/16.4/16.5/16.6 plus deployment proof affected by 16.8, installed-device search/sync proof affected by 16.9, and installed-device branding/cache proof affected by 16.10 is accumulated in **Slice 16.11 end-to-end closeout** rather than falsely marked VERIFIED PROD now.

---

## Ordered V0.5.16 plan

1. 16.0 canonical docs / continuation — ✅ CLOSED
2. 16.1 GitHub hygiene — ✅ CLOSED
3. 16.2 live Outfit sync parity — 🟡 merged, final two-device proof deferred to 16.11
4. 16.3 incomplete Outfit integrity — 🟡 merged, final device QA deferred to 16.11
5. 16.4 runtime hotfix consolidation — 🟡 merged / 12-of-12 PR CI green, final browser QA deferred to 16.11
6. 16.5 i18n architecture cleanup — 🟡 merged / CI green, final browser-device QA deferred to 16.11
7. 16.6 version/cache normalization — 🟡 merged / 14-of-14 PR CI green, installed-device cache QA deferred to 16.11
8. 16.7 CI consolidation + browser smoke — ✅ merged / 9-of-9 CI + deterministic browser smoke green
9. 16.8 taxonomy unification — 🟡 merged / 9-of-9 CI + browser smoke green; Worker deploy proof separate
10. 16.9 repo/deployment governance — ✅ merged / 9-of-9 CI + browser smoke green
11. 16.10 branding source cleanup — ✅ merged / strict branding + generator + browser smoke green
12. **16.11 end-to-end closeout — 🔵 CURRENT FINAL SLICE**

**Do not start V0.5-B before V0.5.16 is closed.**

---

## Next canonical action

### Slice 16.11 — V0.5.16 end-to-end closeout

Engineering is feature-frozen for closeout unless production QA exposes a regression.

1. independently verify the current Pages build identity and Worker health/deployment-sensitive contracts where possible;
2. run the smallest real-device matrix that covers deferred proof: iPhone + secondary device/desktop cross-device sync, installed PWA update/cache, FR↔VI, search, Camera/Gallery, Profile diagnostics and branding;
3. exercise clothing CREATE / UPDATE / DELETE and Outfit CREATE / UPDATE / DELETE with automatic cross-device convergence and no manual refresh;
4. verify incomplete Outfit warning/repair/delete, offline queue recovery, manual sync without unexpected reload, AI human-in-the-loop and Daily Assistant complete-look filtering;
5. finish from Profile diagnostics with no unexpected pending mutations/orphans and record the exact deployed build SHA + clean baseline;
6. only then mark V0.5.16 CLOSED / VERIFIED PROD and unblock V0.5-B wear history & rotation.

Do not introduce unrelated feature work during closeout. Any failure stays inside 16.11 until fixed and re-verified.

---

## Verification vocabulary

- **implemented** — code exists on a branch;
- **PR green** — required PR checks passed;
- **merged** — change is in `main`;
- **deployed** — the intended Pages/Worker state is independently confirmed;
- **VERIFIED PROD** — real production behavior was tested;
- **CLOSED** — documentation is updated and no required slice blocker remains.
