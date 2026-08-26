# Tide Wanderer — «Странник прилива»

Dimension lore for slug `tide` (`art-originals/Tide-Wanderer.png`). Built only
from the painting and its sampled palette; nothing invented about the boy.

## 1. The painting, read closely

A sea turtle climbs a slow diagonal toward the upper right, head lifted, as if
mid-breath of a very long journey. The shell is a mosaic — large panels of deep
and sage green held in ochre-brown seams, drawn first in pencil (the
construction lines still show under the rim and the near flipper, honestly). The
far flipper and the head carry a second mosaic: small ovals of navy, plum and
sage speckling white ground, like light on wet skin. The water is not one blue:
pooled transparent washes with hard bloomed edges, the paper left bare in a halo
around the turtle — unpainted white reading as light. Below, an olive-yellow
seabed wash with crimson coral; at the right edge, a deep-blue blot with a
single hanging drip, and a spatter of dark droplets. The coral's crimson did not
survive the six-colour sampling; the world's coral wears the ochre and olive the
sampler kept, recorded here rather than corrected.

Sampled palette (Law 2 — most-used first, roles from `specs.ts`):

| # | hex | source px | role in world |
|---|-----------|-------------|----------------------------------|
| 0 | `#8A9AA8` | (477, 635) | core — the mid-water wash |
| 1 | `#D2C3AE` | (917, 835) | pale — bare paper, light |
| 2 | `#4E679C` | (139, 199) | deep — pooled blue, the sky |
| 3 | `#999443` | (697, 827) | accentLit — seabed olive |
| 4 | `#9E5B1E` | (316, 776) | accent — shell-seam ochre |
| 5 | `#474D3E` | (756, 561) | surface/stem — shell-panel green |

## 2. The world's story

This is the inside of the wash. The long low swells of the seabed are the pooled
edges of paint, and the water moves the way watercolour moves — not everywhere
at once, but in lanes, where one wash bled into another and never quite stopped.
The close fog is pigment still settling. Somewhere in it a single turtle is
crossing the whole world on a route it has always known, at a pace that never
changes, and everything else — the cairns, the drifting blots, the bare-paper
clearings — exists because the water has been travelled this way for a long
time. The register is the turtle's: slow, unhurried, and going somewhere.

## 3. Signature structures

**Shell gurii — «панцирные гурии»** (a *гурий* is a Pomor seamark cairn).
Low domed cairns tiled like the shell: 3–5 stacked, shrinking rings of surface
green `#474D3E`, ochre `#9E5B1E` seam courses between rings, one pale `#D2C3AE`
crown block; 3–7 blocks wide. Instanced ring stacks, seeded per-site radii.
Lore: shells outlast their wanderers; each gurii is a shed shell raised as a
seamark, leaning one block toward the nearest wash-lane — navigation, not decor.

**Wash gates — «ворота течения»**. Blocky arches the current threads through:
paired 3–4 block pillars of deep blue `#4E679C` with a 3–5 block lintel, 5–9
blocks tall, astride a wash-lane; two box instances plus a lintel run. Lore:
where two washes bled together the water still remembers the join, and under a
gate the lane gives its gentle push. Sparse — one per several chunks.

**Coral stands — «коралловые заросли»**. Branching stacks: a 4–9 block ochre
`#9E5B1E` trunk with 1-block olive `#999443` lateral buds every 2–3 blocks,
clustered 2–4 to a stand on seabed rises. Instanced boxes, seeded branch
pattern. Lore: the painting's coral, wearing the colours the sampling kept;
fish shelter here, and nothing is harvested.

**Paper clearings — «бумажные прогалины»**. Not a mesh — a terrain feature: a
low-frequency seeded mask swaps surface blocks for pale `#D2C3AE` in patches
8–20 blocks across, bare paper showing through the wash; costs one block
substitution. Lore: places the paint never touched, where light reaches the
floor — the quietest places in the world, and where gurii chains end.

## 4. Ambient life

**Fish** — 1–2 block boids in olive `#999443` with ochre `#9E5B1E` speckle, the
flipper-mosaic made mobile; they school through the coral and scatter softly.

**Jelly-blots — «медузы-кляксы»** — the second, quieter thing, taken straight
from the blue blot with its hanging drip at the painting's right edge. A 2-block
dome of deep `#4E679C` trailing a single 2–3 block strand. They never propel
themselves: a jelly-blot moves only with the water, a living plumb-line for the
current — watch the blots and you read the invisible wash-field. Sparse, slow,
seeded spawn points along the lanes.

## 5. Activities

All seeded from the world integer; the wash-lanes are a domain-warped vector field from the terrain's noise family — infinite and reproducible.

- **Riding the washes.** Enter a lane and the water carries you — travel speed
  gently doubles with the current, halves against it. The world teaches the
  turtle's lesson mechanically: the fast way is the water's way.
- **Walking the gurii line.** Each shell cairn leans toward the next; following
  a chain is wayfinding without a map, and every chain ends at a paper clearing.
- **Accompanying the Wanderer.** One turtle crosses the world on a seeded
  circuit, at one unchanging pace. Match its pace and it lets you swim
  alongside as far as you care to go; rush it and it fades into the fog. It is
  never rideable and never speaks.
- **Reading the blots.** Before choosing a heading, watch the jelly-blots —
  their drift is the current made visible. Lore as instrument: the world's only
  navigation aids are its animals and its cairns.

## 6. Key terms

| en | ru |
|---------------------|-----------------------|
| the Tide Wanderer | Странник прилива |
| wash-lane (current) | отмывка-течение |
| shell gurii | панцирные гурии |
| wash gate | ворота течения |
| coral stand | коралловые заросли |
| paper clearing | бумажная прогалина |
| jelly-blot | медуза-клякса |

## 7. Three kitsch traps

1. **The turtle as a mount or quest-giver.** The moment it can be ridden or it
   talks, the painting's dignity is gone. It is accompanied, at its pace, only.
2. **The aquarium kit.** Sunken ships, treasure chests, cartoon bubble streams,
   god-ray caustic shaders — none of it is in the painting, and the glow breaks
   the no-gradients law besides. Muted wash, not a screensaver.
3. **The ecology lecture.** Gentle and ecological because the painting is, not
   because the world scolds. No litter props, no messaging; the clearings are
   quiet, and that is the whole statement.
