# Three Sails at Dusk — «Три паруса в сумерках»

Dimension lore for slug `three-sails`. Painting: `art-originals/Three-Sails-at-Dusk.png`.
Palette: the six sampled hexes in `src/world/generated/palettes.json` — violet-grey
sky #6A768A, dusk grey #686267, sail cream #AAAA98, sea grey-green #848D8F,
slate #4B5058, hull black #322E2B. Nothing below asks for a colour outside that set.

## 1. The painting, read closely

Three sails, and almost nothing else. Each is a tall cream triangle standing
straight up out of a black hull — no rigging, no crew, no deck; the sail IS the
boat. Each is capped by a small brick-red pennant, and all three pennants stream
the same way, so the wind is one wind. The three are not identical: the left
leans slightly, the middle sits lower and further off, the right is tallest and
nearest. Three notes, not one note three times.

Above them, three pale birds in the same cream as the sails — the sky repeating
the sea's idea. Two brick-red cloud smudges echo the pennants. The sea is the
busiest thing in the picture: horizontal dabs of cream, teal and dark grey, each
hull dragging a broken black reflection under itself. A dark mass sits low on
the right horizon — a far shore, or weather. Nothing is in a hurry.

One honest note for builders: the sampled palette holds **no red** — the
pennants are too small to survive sampling. The red stayed in the painting.

## 2. The world's story

A sea at dusk where everything comes in threes, because that is the painting's
music and the world made it a law. Sails stand out of the water like candles
that do not burn; birds cross the sky three at a time; even the glints on the
water gather in threes. Nothing here is ever alone — but sometimes a three is
missing its third, and a pair at evening is the loneliest shape there is. The
world's quiet work, and yours, is completing them.

## 3. Signature structures

All build on the existing SWELL terrain + `pillar` machinery: instanced columns,
Poisson sites, per-site seeded variation. Block roles per the spec: `pale`
#AAAA98, `stem` #322E2B, `deep` #4B5058, `surface` #848D8F, `accent` #686267,
`accentLit` #6A768A — which is also the sky.

**Candle-Sails — Свечи-паруса.** The pillar type, always placed as a triple:
one tall (10–13 blocks), one middle set back, one near — three heights from one
site seed. Each is a tapering `pale` column (3-wide base to 1-wide tip) on a
5×2 `stem` hull two blocks proud of the swell, capped with one `core` block —
the pennant, dark at dusk. Every tip leans one block leeward, all the same way:
one wind. Lore: the standing chords of the sea, one held note per triple.

**Glint Shoals — Отмели-блики.** Flat patches where the sea shows its pattern:
15–30 one-high dabs of `pale` and `accentLit` on the `surface` swell, in loose
horizontal rows like brushstrokes. `accentLit` is the sky's own hex, so they
read as pieces of sky lying on the water — which is what a reflection is.

**Reflections — Отражения.** Under every hull, a broken dashed line of `stem`
and `deep` blocks laid flat on the water, 5–9 blocks with gaps — the painting's
smeared black mirrors. Instanced flat rows, one draw. Lore: a sail's
shadow-twin; the world checking its own arithmetic below.

**The Far Bank — Дальний берег.** One per world: a long low ridge of `deep`
capped with `stem`, 2–4 blocks high, at the fog line (far = 280) on the seed's
bearing. Walkable toward, never reached; the fog keeps it a rumour. Lore: where
the wind is going. Every pennant in the world points at it.

## 4. Ambient life

The three pale birds are already in the sky of the painting — cream Vs, the
same colour as the sails. In the world: one instanced flock of exactly three,
two flat `pale` quads per bird, flapping by vertex offset, flying one seeded
loop across the map. They never land and never split. If you can only see two,
the third is behind you — which makes you turn around, which is the point.

## 5. Activities

Lore as substrate; every one is seeded and works at any map size.

**The Third Sail — Третий парус.** The core loop. Some candle triples generate
as pairs — the seed displaces the third along the wind line, sometimes far. A
pair is visibly unfinished: two sails, one gap. Walk the way the pennants
stream until you find the lone third; stand beside it and it "lights" — `pale`
swaps to sky-colour `accentLit`, in it and in the waiting pair back home.

**Reading the wind — Читать ветер.** Every pennant and leaning tip agrees on
one bearing, and it leads to the Far Bank. No compass UI: the world itself is
the compass, and noticing that is the puzzle.

**Three notes — Три ноты.** Glint-shoal dabs each sound one of three seeded
pitches underfoot; three steps make the shoal's chord. Each candle-triple hums
its own faintly up close — matching a shoal to its triple marks it as that
triple's reflection. A collecting game with no inventory, just light.

**Counting threes — Счёт троек.** The quiet meta-activity: birds, sails,
glints, reflections. The world never states its law; working it out is reading the painting.

## 6. Key terms

| en | ru |
|---|---|
| candle-sail | свеча-парус |
| the triple | тройка |
| pennant | вымпел |
| glint | блик |
| reflection | отражение |
| the far bank | дальний берег |
| wind line | линия ветра |
| dusk | сумерки |

## 7. Three kitsch traps

**1. Sneaking the red back in.** The sampled palette has no red; a scarlet
pennant on every pillar would shout over his dusk. The pennant stays `core`
dark. If red ever enters, it enters by Law 2 — sampled from the actual pennant
paint (a muted brick, not fire-engine) with recorded coordinates.

**2. A sunset gradient.** "Dusk" begs for an orange-to-purple sky. His dusk is
one flat violet-grey (#6A768A), the evening carried entirely by value and fog.
Gradients are banned anyway (Law 5); here the ban is also taste.

**3. The armada.** No harbour, docks, lanterns, ropes, gull-sound loop, or
fisherman's hut. Every added prop turns a poem into a port. Three sails at a
time, far apart — the sparseness IS the companionship; distance is what makes three enough.
