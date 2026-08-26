# Vessel with Shadow — «Сосуд с тенью»

Dimension `vessel`. Painting: `art-originals/Vessel-with-Shadow.png`. Seed 20221827.
Palette (sampled, most-used first): `#949494 #878787 #787878 #A1A1A1 #676766 #535252`.
Roles per `specs.ts`: surface `#949494`, deep `#787878`, pale/accentLit `#A1A1A1`, stem `#676766`, accent `#878787`, core `#535252`. Greys only. That is not a limit; that is the palette.

## 1. The painting, read closely

A tall ceramic jar stands just left of centre and owns the page. Light comes from the upper left; the lit shoulder of the vessel goes almost to bare paper, the shadowed flank builds down through four distinct greys to a base that nearly disappears into its own dark. The rim is drawn honestly — both edges of the opening, slightly uneven, the way a real jar is. Behind everything, the background is one continuous weather of diagonal hatching, upper-left to lower-right: the pressure of a hand, hundreds of strokes, none rushed. The cast shadow falls right and forward, a solid dark territory on the table — and inside that shadow sits the fruit, a small round mass drawn darker than anything but the shadow it lives in. The table's front edge closes the page as a dense low band. Compared with the first graphite study, everything is heavier: deeper darks, bigger form, more patience per square centimetre. Cup-apple is about light touching things. This one is about what things weigh, and the dark ground each heavy thing is given to stand on.

## 2. The world

A flat grey table-land under a sky the colour of worked paper, where the diagonal hatching of the background has become the permanent grain of the air. Every large thing here casts one shadow, and the shadow is not lighting — it is drawn into the ground, block by block, in the darkest greys, always falling the same way, because in a drawing a shadow is a decision that was made once and kept. So the world has two territories with slightly different rules. On the lit side you are quick and light: footsteps tick, jumps carry, the pale moths fly. Inside a shadow you weigh what you truly weigh: steps go quiet, jumps sit lower, nothing bobs or drifts, and things at rest genuinely rest. Neither side is better. The lit side is for going; the shade is for staying. It is the calm of the shade under a wall on a warm afternoon — the sister calm to cup-apple's, but where that world is stillness you can see through, this one is stillness you can lean on.

## 3. Signature structures

**Standing Vessels — Стоящие сосуды.** The landmark type. A lathe profile quantised to voxels: base radius 3, belly radius 4–5, neck radius 2, flared rim, 9–14 blocks tall; surface `#949494`, lit-side vertical stripe of pale `#A1A1A1`, shadow flank stepping `#878787 → #787878 → #676766`. Hollow — the mouth is wide enough to drop into. Each one stamps a cast-shadow apron onto the ground: surface blocks recoloured to core `#535252` in a seeded parallelogram falling south-east, length ~1.5× the vessel's height. Kitchen-shelf objects at walking scale, never monuments: no ornament, no cracks, no glow. Lore: each vessel was thrown slowly and is still holding its shape by concentration.

**Counterweights — Противовесы.** A small sphere quantised to voxels, radius 2, core `#535252` with a single top highlight block of stem `#676766`. One per vessel, always placed on the seam where the vessel's shadow meets lit ground — half in, half out, exactly like the fruit in the drawing. Instanced; trivially cheap. Lore: every heavy thing needs one small thing to balance the page. A vessel whose counterweight has been moved looks subtly wrong until it is returned.

**Stroke-fences — Штрих-изгороди.** The hatching, landed. Long sweeps of thin instanced boxes (1×1×5 blocks) leaning 45°, all parallel, all upper-left to lower-right, in accent `#878787` with occasional pale `#A1A1A1` strokes; rows of 12–30, following the terrain's gentle warp. You can walk between the strokes. Lore: the record of the hand that made the world — the grain of the air, set down where it touched ground.

**The Table Edge — Край стола.** One per world, seeded: a long straight one-to-two-block drop running across the far south, its face and the band beyond it in deep `#787878` over core `#535252`, fading into fog. Not a cliff into void — a low honest step, like the front edge of the table in the drawing. Lore: the end of the still life. Past the edge is the part of the paper nothing was drawn on yet.

## 4. Ambient life

**Paper moths — бумажные мотыльки**: instanced pale `#A1A1A1` flecks, two triangles each, drifting only over lit ground; they will not cross a shadow seam, so a flock traces the shape of the light. **Smudges — растушёвки**: low soft-edged flat creatures the colour of `#676766`, one or two per vessel shadow, that move like slow cats along the inside of the dark and settle against the vessel's base. They only come near a visitor who is standing in shade, and only if the visitor is standing still. **Graphite motes — графитная пыль**: sparse seeded particles falling diagonally with the hatching, visible mainly against the darkest blocks. Nothing here makes noise on its own; the world's sound is the visitor's.

## 5. Activities

- **Seam-walking — По кромке.** The cast shadows are fixed, seeded geometry, so they form a permanent network across the world. Cross from the door to the Table Edge stepping only on shadow blocks — quiet the whole way, heavier the whole way — or only on lit ones, quick and ticking. The route is learnable, like a real shortcut. Shadow is the mechanic: the ground itself keeps score of which territory you are in.
- **Sitting in a vessel — Внутри сосуда.** Climb the shadow flank (the dark side steps out one block near the base, a hand-hold by design) and drop through the mouth. Inside is the deepest calm in the fourteen worlds: full shade rules, the hatching wind inaudible, a circle of paper-grey sky overhead. Nothing happens. That is the feature.
- **Returning counterweights — Вернуть противовес.** Counterweights can be nudged and rolled. Roll one back to the seam of a shadow that has lost its own, and the vessel's rim highlight brightens one step to `#A1A1A1` — the drawing agreeing with you. A visitor who balances every vessel in a region has changed nothing and fixed everything.
- **Befriending a smudge — Приручить растушёвку.** Stand in a vessel's shadow and do not move. After a while the smudge comes and settles against your feet like warmth without temperature. Walk into the light and it stops at the seam and waits. It always waits.

## 6. Key terms

- Тень — the Shade: the territory inside a drawn shadow, where true weight applies.
- Свет — the Lit Side: quick ground; where the moths are.
- Кромка — the Seam: the block-edge where shadow meets light; where counterweights sit.
- Противовес — Counterweight: the small dark mass that balances a vessel.
- Штриховка — the Hatching: the diagonal grain of the air and the stroke-fences.
- Растушёвка — Smudge: the shade-dwelling ambient creature; a blended stroke that got up.
- Край стола — the Table Edge: the drawn world's honest southern end.

## 7. Kitsch traps

1. **The spooky shadow realm.** The obvious failure. This is a peaceful drawing; its shadow is shade, not menace. No whispers in the dark, no eyes, no fog that thickens, no music cue at the seam. The Shade is where a smudge sleeps and a visitor rests. If crossing into shadow ever feels like a warning, the world has been overwritten.
2. **Smuggled colour.** One warm brown "for the ceramic", one red "for the fruit", a blue-grey "for mood". No. Six sampled greys are the entire palette because graphite is what he chose and value is what he was practising. The moment a hue appears, the world stops being his drawing (Law 2).
3. **The dramatic sun.** A moving light source with real-time shadows would be technically impressive and completely wrong: it erases the drawing's central decision. The shadow was placed once, by hand, and kept. It is geometry, not lighting — permanent, seeded, always falling the same way. A world where the shadows crawl is somebody else's world.
