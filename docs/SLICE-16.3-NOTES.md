# V0.5.16 · Slice 16.3 — Outfit incomplete integrity

Status: implementation candidate on `v0.5.16-outfit-incomplete-integrity`.

## Product contract

An Outfit is considered `incomplete` when fewer than **2 linked clothing items can be resolved locally**.

This state is **derived**. Detecting an incomplete Outfit must not automatically update, delete, queue, or otherwise mutate Airtable/IndexedDB canonical data.

Incomplete Outfits:
- remain visible in `Phối đồ` / `Tenues`;
- display an explicit warning and current resolved count;
- can still be opened, edited/repaired, favorited, or deleted by the user;
- are not presented as a share-ready complete Lookbook;
- are excluded from Daily Assistant saved-Outfit recommendation/ranking as complete looks.

This deliberately preserves the human-in-the-loop rule: **Trân decides whether to repair or delete an incomplete Outfit.**

## Current real-world trigger

The audited Outfit `Lookbook Test` had only one remaining linked item (`Melody Bag`) after clothing lifecycle changes. Slice 16.3 is designed to represent that state honestly rather than silently treating it as a normal complete Outfit.

## Validation

`scripts/test-outfit-integrity.mjs` covers:
- one resolved item => `incomplete`;
- two resolved items => `complete`;
- one valid + one missing linked id => `incomplete`;
- filtering helper keeps only complete Outfits;
- Daily Assistant keeps a complete saved top+bottom Outfit eligible;
- Daily Assistant excludes a saved one-piece-only Outfit despite it being wearable by itself;
- Daily Assistant excludes an Outfit with only one resolved linked item.

Formal production verification remains separate from PR CI.
