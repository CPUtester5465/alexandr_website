# poppy-sky-001 — VERDICT: ITERATE (shipped provisionally, regenerate later)

Generated 2026-08-26, marble-1.1 full world (1500 cr, bundled pano), from the
raw painting photo + a freestyle text prompt. Tim's reaction: "visual quality
is overall meh… the details… maybe the soul." The court agrees and can name it.

## Measured
Share-weighted palette distance 14.0. One FOREIGN colour at 33% share
(#B3BC9A, dE 22.9) — the invented pale sky band. Fails the ship bar.

## Named defects
1. **Foreign sky band (33% of the image).** The painting has no sky; green is
   the weather, edge to edge. The prompt invented "horizon dissolving" and the
   model obeyed. Prompt-authored defect.
2. **Facture split.** The blooms Marble *copied* from the source carry his
   impasto — lumpy, wet, colours smeared into each other. The blooms it
   *invented* are clean botanical illustration: tidy outlines, crackle fills,
   white rim highlights, pencil hatching. Two artists in one sky; only one of
   them is him.
3. **The spatter is gone.** The painting's signature texture — white/pink
   drips and flecks across the green — survives only near the copied bloom.
   The invented meadow is banded smooth greens with foreign brown striations.
4. **Invented anatomy.** Elegant curved stems, seed pods, botanical grass —
   none are in the painting. (The pods accidentally rhyme with the lore's
   "bare capsules", which shows what prompting FROM the brief would have got
   on purpose.)

## Iteration order for poppy-sky-002
- Prompt from the lore brief's close read, not freestyle. No horizon, no sky:
  green weather in every direction, drizzle, spatter named explicitly.
- Style clause leads: "a child's oil painting, heavy wet impasto, paint
  smeared into paint, thick drips and spatter" — before any scene content.
- Feed a cropped, painting-only reference (no wall, no margin), colour-
  corrected by the deskew pipeline when it lands.
