# V0.5.16 · Slice 16.5A — Keyed i18n foundation

Status: implementation candidate on `v0.5.16-keyed-i18n`.

## Purpose

Begin replacing post-render DOM text translation with render-time keyed translations without performing a risky full rewrite of legacy `app.js`.

## New canonical keyed translator

`js/i18n-keyed.mjs` provides:
- VI / FR message dictionaries;
- `t(key, params, language)`;
- current-language resolution with VI fallback;
- parameterized/plural dynamic messages;
- translation-key parity tests.

## Migrated dynamic surfaces

The following canonical runtime modules now render user-visible dynamic copy directly from keys:
- `closet-search.js`;
- `photo-picker.js`;
- `manual-sync.js`;
- `outfit-integrity-ui.js`;
- `outfit-presentation.js`;
- `daily-assistant.js`;
- `build-version.js`;
- `sync-diagnostics.js`.

`daily-assistant-core.mjs` now emits structured `{key, params}` explanation descriptors instead of Vietnamese explanation sentences. Weather summaries likewise expose keyed descriptors through `weatherSummaryParts()`.

## Deliberately not closed yet

`js/i18n.js` and `js/i18n-runtime-compat.js` remain active for legacy `app.js`, Outfit Picker and AI surfaces not yet migrated. This is intentional and is asserted by the 16.5A gate so the project cannot silently claim that the i18n cleanup is complete.

The next sub-pass must migrate the remaining legacy dynamic surfaces, then remove `i18n-runtime-compat.js`; only after the legacy route renderer is safely covered should the old mutation-based translation engine be retired/reduced further.

## Validation

`scripts/test-keyed-i18n.mjs` verifies:
- VI/FR key parity;
- fallback language behavior;
- parameter/plural behavior;
- representative photo/sync/integrity/weather/occasion translations;
- Daily Assistant explanation output uses keyed descriptors;
- weather summaries use keyed descriptors.

`validate-v0516-keyed-i18n.yml` additionally checks syntax, migrated imports, removal of exact-text matching from migrated surfaces, runtime/offline wiring, and explicitly bounds the remaining legacy bridge.

Formal browser/device FR↔VI verification remains separate from PR CI and ultimately belongs to Slice 16.11.
