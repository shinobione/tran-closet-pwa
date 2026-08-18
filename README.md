# Trân's Closet — Smart Fashion Wardrobe

Mobile-first PWA for Trân's wardrobe, installable on iPhone/Android, offline-first, synchronized through a secured Cloudflare Worker and Airtable, with assisted photo analysis, Smart Tags, Outfits and a weather-aware daily assistant.

## Current status

- **Current production baseline:** `v0.5.15`
- **V0.2 Airtable Bridge:** ✅ CLOSED / VERIFIED PROD
- **V0.3 Outfits:** ✅ CLOSED / VERIFIED PROD
- **V0.4 Smart Closet:** ✅ CLOSED / VERIFIED PROD
- **V0.5-A Daily Assistant:** 🟢 deployed / operational
- **V0.5.16 Consolidation & Hardening:** 🔵 active engineering phase
- **V0.5-B Wear history & rotation:** ⏭ after V0.5.16

The current product is functional, but v0.5.8→v0.5.15 accumulated runtime, i18n, cache, CI and repository debt. The project is intentionally consolidating before adding the next feature phase.

## Start here — every new work session

**Do not reconstruct the project from chat history. Read the repository.**

1. [`VERSION`](./VERSION)
2. [`docs/PROJECT-STATE.md`](./docs/PROJECT-STATE.md) — current factual checkpoint, blockers and next canonical action
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
- secured Cloudflare Worker for canonical writes/read paths and Workers AI;
- Airtable canonical clothing + Outfit tables;
- GitHub-generated Airtable snapshots as fallback/offline artifacts;
- live canonical clothing reread for cross-device convergence;
- FR / VI UI;
- exact deployed build identification through `build-info.json`.

## Product capabilities

- clothing CRUD + photos;
- search, filters and favorites;
- Outfit CRUD + scalable picker;
- full-screen Lookbook + PNG/Web Share;
- AI-assisted photo classification with human validation;
- Duplicate Guard;
- 22 Smart Tags;
- weather/context-aware `Hôm nay mặc gì?` assistant;
- PWA branding, app icons and iPhone startup splash;
- sync diagnostics and recovery paths.

## Development

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Project discipline

Every merged slice that changes runtime or project status must update `PROJECT-STATE.md`, and any sequencing change must update `ROADMAP.md`. `VERIFIED PROD` is reserved for real production QA, not merely green CI.
