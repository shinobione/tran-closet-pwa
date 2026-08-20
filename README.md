# Trân's Closet — Smart Fashion Wardrobe

Mobile-first PWA for Trân's wardrobe, installable on iPhone/Android, offline-first, synchronized through a secured Cloudflare Worker and Airtable, with assisted photo analysis, Smart Tags, Outfits and a weather-aware daily assistant.

## Current status

- **Current production baseline:** `v0.5.16`
- **V0.2 Airtable Bridge:** ✅ CLOSED / VERIFIED PROD
- **V0.3 Outfits:** ✅ CLOSED / VERIFIED PROD
- **V0.4 Smart Closet:** ✅ CLOSED / VERIFIED PROD
- **V0.5-A Daily Assistant:** ✅ operational
- **V0.5.16 Consolidation & Hardening:** ✅ CLOSED / VERIFIED PROD
- **V0.5-B Wear history & rotation:** 🔵 ACTIVE — current slice **B.1 Wear-event foundation**

V0.5.16 closed the accumulated runtime/i18n/cache/CI/repository debt and completed real production QA for live cross-device clothing + Outfit convergence, incomplete-Outfit integrity, offline recovery, FR/VI UI, Camera/Gallery, Profile stability and AI human-in-the-loop behavior.

## Start here — every new work session

**Do not reconstruct the project from chat history. Read the repository.**

1. [`VERSION`](./VERSION)
2. [`docs/PROJECT-STATE.md`](./docs/PROJECT-STATE.md) — current factual checkpoint and next canonical action
3. [`docs/ROADMAP.md`](./docs/ROADMAP.md) — ordered master roadmap and cross-session continuation protocol

When chat history and the repo disagree, verify `main` and follow the repo.

## Production

PWA:

`https://shinobione.github.io/tran-closet-pwa/`

Cloudflare Worker:

`https://tran-closet-sync.jerryquinet.workers.dev`

The app is local-first: clothing and Outfit changes are applied immediately in IndexedDB, then synchronized through separate mutation queues when the Worker/network is available.

## Core architecture

- static PWA deployed by GitHub Pages;
- IndexedDB local store (`tran-closet`, schema v4);
- secured Cloudflare Worker for canonical reads/writes and Workers AI;
- Airtable canonical clothing + Outfit tables;
- GitHub-generated Airtable snapshots as fallback/offline artifacts;
- live canonical clothing + Outfit rereads for cross-device convergence;
- FR / VI keyed UI;
- canonical taxonomy source (`17 categories / 24 colors / 6 styles / 22 tags`);
- exact deployed build identification through `build-info.json`;
- version+SHA Service Worker cache identity;
- 9-workflow CI topology with deterministic system-Chrome smoke.

## Product capabilities

- clothing CRUD + photos;
- search, filters and favorites;
- Outfit CRUD + scalable picker;
- incomplete-Outfit lifecycle safety;
- full-screen Lookbook + PNG/Web Share;
- AI-assisted photo classification with human validation;
- Duplicate Guard;
- 22 Smart Tags;
- weather/context-aware `Hôm nay mặc gì?` assistant;
- PWA branding, app icons and iPhone startup splash;
- offline queues, live cross-device sync and diagnostics/recovery paths.

## Current product work — V0.5-B

The next feature generation adds **wear history & rotation** without automatic decisions:

- explicit manual `Worn today` action;
- event-based wear history rather than destructive counters;
- derived last-worn / wear-count signals for Outfits and clothing;
- canonical cross-device wear history in a later B.2 slice;
- rotation signal added to Daily Assistant only after the history model is proven.

No wear event is inferred from merely opening, sharing, editing or favoriting an Outfit.

## Development

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Project discipline

Every merged slice that changes runtime or project status must update `PROJECT-STATE.md`, and any sequencing change must update `ROADMAP.md`. `VERIFIED PROD` is reserved for real production QA, not merely green CI.
