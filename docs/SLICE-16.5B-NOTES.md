# V0.5.16 · Slice 16.5B — Retire runtime i18n compatibility bridge

Status: implementation candidate on `v0.5.16-keyed-i18n-legacy-bridge`.

## Purpose

Remove the transitional `i18n-runtime-compat.js` MutationObserver introduced during Slice 16.4 by migrating its remaining legitimate runtime responsibilities to render-time keyed translations.

## Outfit Picker

`outfit-picker.js` now imports `t()` from `i18n-keyed.mjs` and renders directly in VI/FR:
- selection count;
- visible/total result count;
- search placeholder/label;
- reset;
- favorites / selected-only filters;
- category filter labels;
- empty result state;
- selected-item remove labels.

Category search remains bilingual through canonical VI/FR taxonomy labels.

## Legacy app.js targeted migration

`app.js` was intentionally not rewritten wholesale. A guarded one-shot migration ran on GitHub Actions with exact one-occurrence assertions, then removed its own workflow/script after success.

Migrated app outputs:
- edit eyebrow;
- edit-photo preservation note;
- delete syncing/offline statuses;
- already-installed toast;
- iPhone/browser install help;
- photo preview alt text;
- Profile privacy note.

The privacy note source previously contained mixed VI/FR (`Vêtements` / `canonique`); it now comes from a keyed `app.privacy` message.

## Bridge retirement

`js/i18n-runtime-compat.js` is physically deleted and absent from:
- `bootstrap.js`;
- Service Worker app shell;
- validation gates.

The old broad `i18n.js` translator still exists for legacy static route copy and AI/duplicate surfaces not yet migrated. Its further retirement/reduction is the remaining Slice 16.5 work; removing the runtime compatibility bridge does **not** by itself close 16.5.

## Validation

The keyed i18n test now includes representative app and Outfit Picker keys. CI gates assert:
- app + picker import `i18n-keyed.mjs`;
- the retired bridge file does not exist;
- bootstrap/SW do not reference it;
- mixed-language privacy source strings cannot return;
- app/picker current runtime URLs use `v0.5.16`;
- historical camera/search/Profile/AI/Smart Tags guards remain intact.

Formal browser/device FR↔VI QA remains part of Slice 16.11.
