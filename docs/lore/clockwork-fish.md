# Clockwork Fish — Часовая рыба

Dimension lore for slug `clockwork-fish`. Source: `art-originals/Clockwork-Fish.png`.
Palette, terrain (RIDGE) and structures (PILLARS) per `src/world/dimensions/specs.ts`.

## 1. The painting, read closely

It is painted **on glass**, and that decides everything. The fish is built like a
stained-glass window: thick black contour paste for the leading, enamel fills of
cobalt, peach-orange, umber and pearl inside each cell, fins spread like folded
paper fans. The fish hangs vertically, head down, mid-dive through the pane.
Around it the machinery is drawn in **line only** — gear rings like camera
apertures, left as clear glass, never filled. One wheel carries the word *Pisces*
in cursive; the margins hold his working: a long hand-written number, ×24, ×22,
6×4, small stamped shapes. Colour belongs to the living thing; the mechanism is
transparent. The world's signature light is leaded-glass light: flat panes of
colour separated by black lines, with the pale glass ground glowing behind both.

## 2. The world

A high, ridged country of pale glass where living things and clockwork were never
two kinds of thing. Gears here are not made in factories; they grow, the way
shells grow, and the fish swim through the air because the air is the water of
this place. Time is the weather: the whole landscape ticks, quietly and slightly
out of phase, ridge answering ridge. Nothing hunts and nothing hurries — but some
mechanisms have wound down and stopped, and a stopped wheel is the one sad note
in the ticking, the undertone under the play. Whoever walks here can wind them.

## 3. Signature structures

Palette roles from the spec: surface `#A09B96`, deep `#685F58`, pale `#CBC7C0`,
lead `#2C2529` (stem/core), slate `#65778B` (accent), brass `#AB794F` (accentLit).

**Wheel of Hours — Колесо часов.** A great upright ring standing on a ridge crest:
rim of lead-black blocks, spokes of pale glass blocks laid like the painting's
aperture wheels, hub a single brass block. Built from one ring of cubes plus an
`InstancedMesh` of spoke blocks; the whole group rotates around its axle at one
turn per few minutes — visible, slow, cheap. 12–20 blocks across. Lore: each
wheel counts something different, and no two count the same thing.

**Glass Fin Grove — Роща стеклянных плавников.** Clusters of flat fan shapes on
lead stems: wedge panes of slate and brass blocks, each pane edged in lead-black,
splayed like the fish's fins. Instanced wedges, 4–7 panes per fan, 5–9 blocks
tall, leaning with the ridge. They rock through a few degrees, slower than any
wind. Lore: these are fins the land grew for itself; the fish rest against them.

**Winding Post — Заводной столб.** The spec's pillars, given their meaning: a
column of deep-umber blocks with a square brass key on top — two crossed slabs,
like the key of a wind-up toy. Wound posts turn their key slowly; a seeded
fraction stand **stopped**, key frozen mid-turn, silent. 6–14 blocks tall.
Lore: the posts are the springs of the country. The ticking radiates from them.

**Number Reef — Числовой риф.** Low outcrops on flat ground where his margin
working stands as voxel glyphs: ×24, ×22, 6×4 built in lead-black blocks two
high, geometry not text, on pale ground. Aligned to the grid — things that were
worked out sit where they were put. Lore: the world's sums, left where the maker
counted, still true.

## 4. Ambient life

**Air-fish — воздушные рыбы.** Block fish in cobalt-slate and brass with fan-fin
wedges, swimming shoulder-height through the air in seeded shoals. They do not
glide: they move **on the tick**, an escapement swim — hold, flick, hold — tail
snapping like a second hand. One rigged mesh, instanced; motion is a stepped
curve, cheaper than smooth and far more alive. Shoals orbit Wheels of Hours and
thread between the fin groves. Near a stopped post, fish hang still in the air
mid-flick, waiting.

## 5. Activities

All seeded from the world integer; none exhaust.

- **Winding — завод.** Stand at a stopped post and wind it: the key turns, the
  tick returns, the fish frozen nearby resume mid-flick. Stopped posts are a
  seeded fraction of infinitely many; there is always a next one, further out.
- **Riding the wheels — катание на колёсах.** Step onto a Wheel of Hours spoke
  and ride it — up over the ridge and down the far side. The wheel does not
  speed up for you; you wait for your spoke, like waiting for a swing.
- **Following a shoal — идти за стаей.** Every shoal is walking a seeded circuit
  between posts and wheels. Follow one long enough and it leads you to whichever
  of its posts has stopped — the fish know where the silence is.
- **Counting at the reefs — счёт на рифах.** Shoals pass a Number Reef in exact
  seeded counts. Stand at the reef, count a shoal, check it against the glyphs.
  The sums are never wrong; the game is being sure.

## 6. Key terms

| en | ru |
|---|---|
| leaded-glass light | витражный свет |
| the tick | ход |
| Wheel of Hours | Колесо часов |
| Glass Fin Grove | Роща стеклянных плавников |
| Winding Post | Заводной столб |
| Number Reef | Числовой риф |
| air-fish | воздушные рыбы |
| escapement swim | ходовой ход рыбы |
| a stopped one | остановившийся |
| winding | завод |

## 7. Kitsch traps

1. **Off-the-shelf steampunk.** No goggles, rivets, copper pipes, pressure
   gauges or Victorian brown. The painting's machinery is line-drawn and
   transparent — lead skeleton and clear glass, not greeble. If a structure
   would fit an airship deck, it is wrong here.
2. **The menacing machine.** No smoke, rust, factory drone, or nature-versus-
   industry battle. The undertone is a stopped wheel, not an evil one; the
   sadness is quiet and fixable by an eleven-year-old with a key.
3. **The aquarium kit.** No bubbles, seaweed, caustics, sunken chests, or
   underwater blue grading — the fish swim in air on glass light. And no
   clock-face literalism either: no Roman-numeral dials, no melting clocks.
   His numbers are multiplication notes in a margin, and that is what appears.
