# Pagoda in Red Weather — «Пагода в красную погоду»

Dimension `pagoda` · source `art-originals/Pagoda-in-Red-Weather.png` ·
sampled palette: `#99464C` red sky, `#201F20` pagoda black, `#3B3839` soot,
`#737479` mist, `#C87467` window ember, `#B5B0AF` pale mist · spec: RIDGE
terrain, fog 25/200 — the closest fog of any painted world. That is the engine.

## 1. The painting, read closely

Five tiers, bottom-heavy and narrowing, each capped by eaves that flick up at
the tips like brush strokes that didn't want to stop. The building is one flat
black — no texture, only edge. Behind it a mound of grey: not sky, a *shape*
of mist, rounded like a hill standing behind the tower. Around it, wet-into-wet
carmine with pinker openings, and a dark branch reaching in from the top-left.
Two black dots hang off the eave tips like bells, or birds that landed and
stayed. And the windows: one ember square per upper tier, two at the base, and
on the second tier a whole band of little panes — frames pencilled first, then
filled orange. That band is the loudest thing in the picture. The house is
dark, but a whole floor of it is awake.

## 2. The world's story

A valley of ridges where the mist never fully lifts, in the season called red
weather — «красная погода» — when the leaves come off the trees, take to the
air, and mostly decline to come down. Through the mist stand pagodas, near and
far, tall and small, all the same patient black. Each was built just high
enough to hold one lamp above the mist; but mist rises a little every year, so
every generation adds a tier, and the height of a pagoda is simply its age.
Nobody is ever seen on the paths; no door is ever seen to open. And yet at
dusk the windows light — one here, a band of them there — and a lamp that
burns is a lamp that someone tends. The world never says who. Someone is home;
that is all you are told, and it is enough.

## 3. Signature structures

**The Grand Pagoda — «Великая пагода».** Rarest and oldest: 5–7 tiers, 14–20
blocks, on ridge crests. Tiers are shrinking boxes of `#201F20` with eave
slabs overhanging 2 blocks, one raised block at each tip (the flick), and a
thin 3-block crown spire. One `#C87467` window per upper tier; the second tier
carries the *band* — a row of lit panes as an InstancedMesh of 1×1 ember
quads. Lore: the valley's elders; every other lamp descends from one of these.

**The Wayside Shrine — «Придорожная пагода».** Common: 2 tiers, 4–6 blocks,
scattered on slopes and hollows (Poisson, unaligned — shrines were put where a
traveller got lost, not on a plan). One window, lit or dark by seed. Lore: a
chain of lit shrines is a path someone still keeps; a dark one, forgotten.

**The Bell Gate — «Колокольные ворота».** Two black pillars, 4 blocks, a beam
across, one hanging 1-block bell of `#3B3839` — the painting's eave-dots
promoted to architecture. Placed on saddles between ridges. Lore: gates close
nothing; they mark where the mist runs deepest, and the bell answers wind so
you hear a crossing before you see it.

**The Red Bough — «Красная ветвь».** A leaning trunk of `#201F20`, 5–9 blocks,
with an off-centre canopy of `#99464C` salted with `#C87467` and rare
`#B5B0AF` (the pink openings in the paint). Clusters on lee slopes. Lore: the
trees are where red weather is made; leaves leave and don't return, and the
trees don't seem to mind.

## 4. Ambient life

Red leaves drifting more sideways than down — a seeded particle stream that
thickens near boughs and thins over open ridges. Mist pooling in hollows (fog
density nudged by altitude). Bells sounding one soft low tone when wind
crosses a gate, never a melody. And the eave-dots: dark bird silhouettes on
grand-pagoda eaves that lift off, unhurried, when the boy gets within ten
blocks — always leaving, never arriving. Nothing here approaches him; the
eeriness is entirely things minding their own business.

## 5. Activities

**Going toward the light — «Идти на свет».** From any lit window, exactly one
other sits at the fog's edge (guaranteed by seeded chain placement). The chain
never ends, but it *turns*, and what it turns around is worth arriving at: a
grand pagoda, a bough cluster, a gate. Each next lamp is a small event.

**Waking the shrines.** Standing beside a dark shrine for a moment lights its
window (per-chunk state, seeded default). No reward but the lamp behind you.

**Climbing above the weather.** Grand-pagoda eaves are 2-block steps — a
natural staircase. From the crown, mist lies below and there is only red sky
and other crowns; the number visible per summit is a per-seed fact, and a
natural thing to go tell a friend.

**Listening for gates.** In deep hollows the fog closes to almost nothing and
the bell tone, louder toward its source, becomes the only navigation.

**The oldest lamp.** Pagodas get taller toward the valley's heart. Walking the
gradient — always toward the taller silhouette in the mist — is a pilgrimage
with a real direction to it, seeded and endless.

## 6. Key terms

| en | ru |
|---|---|
| red weather | красная погода |
| someone is home | кто-то дома |
| grand pagoda | великая пагода |
| wayside shrine | придорожная пагода |
| bell gate | колокольные ворота |
| red bough | красная ветвь |
| going toward the light | идти на свет |

## 7. Three kitsch traps

**Orientalism kitsch — the big one.** No dragons, gongs, pseudo-calligraphy,
"Asian" display fonts, or invented Eastern place-names. The pagoda here is not
a postcard of China or Japan; it is a shape an eleven-year-old in Kursk
painted, and the world borrows *his* silhouette — tiers, flicked eaves, lit
windows — and nothing beyond it. Names stay native Russian and English. If a
prop needs a culture to explain it, it doesn't go in.

**Horror creep.** Eerie is fog, distance, and lamps nobody is seen to tend —
never red-lit windows, figures behind panes, or anything that notices the
player. Windows stay warm `#C87467`; the resident stays entirely offstage.

**Lantern-festival cosiness — the opposite failure.** No fireflies, sparkle
petals, or strings of glowing everything. The painting is mostly dark; light
is rationed like the study's red. One lamp at the fog's edge is worth more
than fifty, and fifty would cost the one.
