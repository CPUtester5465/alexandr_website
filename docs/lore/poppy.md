# Poppy in Green Weather — «Мак в зелёную погоду»

Lore for the `poppy` dimension. Fiction about the world only; nothing claimed
about the boy. Every colour below is a sampled hex from `Poppy-in-Green-Weather`.

## 1. The painting, read closely

One poppy fills the whole square, seen from directly above, so close there is no
horizon — only flower and field. The petals are laid on so thick they stand off
the surface in ridges: crimson worked with orange, embered pink, streaks of
near-black, and small dabs of yellow caught in the folds. The centre is a dark
seed-head flecked with yellow. Around it the green is weather, not ground: fine
pale speckles drift across it like drizzle or pollen, white smudges pass like
thin cloud, and loose crimson flakes — shed petals — float in a slow ring around
the flower. Nothing else is happening, and that is the point: it is a close-up
of one living thing at full volume.

## 2. The world's story

The world is the painting's green taken literally: here, weather is green. A
fine mint drizzle falls almost always — it never soaks, it only speckles — and
it is what everything grows from. The meadow rolls on forever at the scale the
painting implies: you are small enough that a poppy is a tree, and each poppy
grew where enough drizzle once landed in one place. Petals here are laid on
thick, like the paint they are made of; when a poppy is done holding one up, it
lets it go, and the petal drifts a long way before it lands. So the whole map is
a record of weather: standing flowers where the green fell generously, bare
seed-heads where a flower has already spent itself, fallen petals where the wind
carried the colour. Somewhere near the centre of it all stands the First Poppy —
the one the painting looks straight down at.

## 3. Signature structures

Generated across the map alongside the existing FLOWERS pass; all buildable from
boxes and simple bent strips, instanced, seeded from cell coordinates.

**Fallen Petal — «Опавший лепесток».** A single shed petal the size of a boat,
lying curled on the grass: a bent shell 6–9 blocks long and 2–3 high, open on
one side so the player (≈2 blocks) can walk in under it. Top face `accentLit`
`#A23637`, underside `accent` `#643132`, a rim streak of `core` `#C4784D`. Role:
where colour came down. Under a petal the drizzle stops — the oldest shelter in
the world.

**Bare Capsule — «Пустая коробочка».** A poppy that has already flowered: a
plain `stem` `#476737` stalk, 7–12 blocks, topped not with petals but with a
dark domed head of `accent` `#643132` flecked with single `core` `#C4784D`
blocks — the painting's centre, standing alone. Role: the elders of the meadow.
Their seeds fall at their feet.

**Speckle Pool — «Зелёная лужица».** Where drizzle has pooled: a flat disc of
`pale` `#6E9767`, 2–4 blocks across, flush with the `surface` `#557D46` ground,
usually in loose clusters of three to six — the painting's spatter laid flat.
Role: the weather's footprints. Stepping on one makes it ring a soft note and
brighten for a beat.

**Cloud Smudge — «Белёсый мазок».** A low drifting ribbon of `pale` `#6E9767`
blocks or flat quads, 1 block off the ground, 8–14 long, slowly sliding across
the meadow — the painting's white smudges at ground level. Role: passing
weather you can stand inside; the world goes quiet and pale for a moment.

## 4. Ambient life

Nothing here has a face. What moves is the weather and what the weather carries.

- **Petal drift — «лепестковая метель».** Loose flocks of 20–40 shed petals:
  flat two-tone quads (`accentLit` over `accent`), each 1–2 blocks across —
  blanket-sized at player scale — tumbling slowly downwind in a boid drift that
  never lands while you watch. Density rises near Bare Capsules.
- **Green drizzle — «зелёная морось».** A few hundred instanced `pale` motes,
  falling slow and slightly aslant, fading out a block above the ground.
  Suppressed under Fallen Petals — you hear it stop before you see why.
- **Seed hoppers — «зёрнышки».** Single `core` `#C4784D` cubes at the feet of
  capsules that give a small, springy hop every few seconds (seeded phase per
  seed). Not creatures — just seeds that haven't settled yet.

## 5. Activities

1. **Gathering seeds.** Each Bare Capsule has 1–3 seeds at its base, placed by
   a hash of the capsule's position — findable via the map, same on every
   device. Walk into one to collect it, with a low woody knock.
2. **Planting.** Spend a seed anywhere on open grass: over about twenty
   seconds a small poppy grows where you stood — stem, then petals unfolding
   thick, like paint going on. It lasts the session; the meadow keeps the
   permanent record, you keep the temporary one.
3. **Shaking a poppy.** Bump a flowering poppy's stem and it releases two or
   three petals into the drift overhead. Repeatable, pointless, and the best
   thing in the world to do.
4. **Pool-hopping.** Cross every pool in a Speckle Pool cluster without
   touching grass and they replay their notes in order, brightening once — a
   found melody, different in every cluster, same for every visitor.
5. **Finding the First Poppy.** At the world origin stands the largest poppy on
   the map, petals at their thickest, ringed by the densest petal drift — the
   flower the painting looks down on. The way there: petal drift always leans
   loosely toward the centre, so you can navigate by colour on the wind.

## 6. Key terms bilingual

| en | ru |
|---|---|
| Green Weather | зелёная погода |
| The First Poppy | Первый мак |
| Fallen Petal | Опавший лепесток |
| Bare Capsule | Пустая коробочка |
| Speckle Pool | Зелёная лужица |
| Cloud Smudge | Белёсый мазок |
| Petal drift | лепестковая метель |
| Green drizzle | зелёная морось |
| Seeds | зёрнышки |

## 7. What would ruin it

- **Remembrance solemnity.** A red poppy carries memorial symbolism it did not
  ask for. This is a boy's flower at full volume — no wreaths, no minute of
  silence, no imported gravity.
- **Sleepy-poppy-field magic.** No drowsiness mechanics, no soporific pollen,
  no Oz. The drizzle is weather, not an enchantment; nothing in this world
  wants anything from the visitor.
- **Populating the meadow.** No fairies in the flowers, no ladybirds with
  eyes, no cottage. The moment something here has a face, the close-up of one
  living thing becomes a theme park. The flower is the inhabitant.
