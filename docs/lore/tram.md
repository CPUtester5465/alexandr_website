# tram — Last Run of Tram No. 5 / «Последний рейс пятого трамвая»

Source: `art-originals/Last-Run-of-Tram-No-5.png`. Spec: STILL terrain (near-flat,
base 3, amplitude 0.9), PILLAR structures, fog 18/150 — the closest of the
fourteen. The sky is `#7E8383`, the same grey as the pavement, which is exactly
what a wet city night does. All colours are the sampled six; nothing else.

## 1. The painting, read closely

The tram fills the street, front-on, coming toward you. Its red face carries a
big hand-painted 5 in lamp-cream, slightly wobbly the way numbers on real trams
are. Two headlamps sit low on the red like coat buttons. Above, a tan band and
three windows: dark glass streaked with fogged blue — condensation, breath,
people were in here. The street is barely wider than the tram; brown facades
lean in on both sides, marked with pale vertical strokes that read as lit
windows and their reflections. The pavement is wet grey, and two yellow-green
streaks run out of the bottom of the frame: the headlamps, poured onto asphalt.
Nothing here is sinister. It is late, the tram stopped anyway, and it is red —
the warmest thing on the street.

| share | hex | in the painting | spec role |
|---|---|---|---|
| 32% | `#7E8383` | wet pavement, and the sky | surface |
| 26% | `#453A36` | the dark facades | stem, core |
| 21% | `#635A53` | deep street shadow | deep |
| 11% | `#B2493D` | the tram's red | accent |
| 6%  | `#A48A68` | tan band, window frames | accentLit |
| 5%  | `#B2B190` | lamps, the 5, headlamp streaks | pale |

Honest note: the fogged window-blue did not survive sampling. **There is no
blue in this world.** Windows glow lamp-cream: light from inside, not fog on glass.

## 2. The world's story

A city near the end of service, around 23:40. The fog stands eighteen blocks
away in every direction, the ground is flat as asphalt, and the only geography
that matters is where the rails go: the tram line is the lifeline, the one warm
thread stitched through the dark. Everything bright is either a window somebody
left lit or the tram itself, and one tram is still out — the last run, driven by
someone patient who always waits the extra second at the stop. Being out this
late is not danger; it is the small heroism of the painting: the city is asleep,
not gone, the bell carries through the fog, and everyone gets home.

## 3. Signature structures

**Tram No. 5 — Трамвай № 5** (moving landmark, unique). One instance. Box
assembly ~3 wide, 4 tall, 7 long: accent-red body, accentLit tan roofband,
glowing pale window blocks, two pale lamp blocks low on the face, stem-dark
undercarriage; the 5 as a 3×5 pale pixel glyph on the front. Travels the rails
slightly faster than walking; rings a two-note bell approaching stops and waits
there a few seconds. Lore: the world's clock and compass — everything else is
placed relative to its line.

**Facades with lit windows — Дома с горящими окнами.** What the spec's pillars
are here: not columns but slices of house. Stem-brown columns, radius 1, height
6–18, faces studded (seeded, ~1 cell in 6) with accentLit window blocks — and at
most one per column glowing pale. Lore: each lit window is somebody still up,
waiting, reading, keeping soup warm. The lit ones are the night's constellations.

**Tram stops — Остановки.** On the line at seeded intervals: two stem posts, a
3×1 accentLit roof, one pale lamp block beneath it, a deep-grey bench block. The
lamp is the brightest thing between tram passes. Lore: the covenant of the
network — stand under the lamp and the tram will stop.

**Catenary poles and rails — Столбы и рельсы.** Rails: two parallel runs of
deep-grey blocks flush in the surface, a seeded polyline wandering on without
end — the route is longer than the night. Poles: 1×6 stem columns with a 2-block
accentLit crossarm every ~12 blocks, alternating sides. Lore: lost in fog, find
a pole; the pole finds the rails; the rails go home.

## 4. Ambient life

- Drizzle: sparse, slow surface-grey particles, visible only against lamps and
  lit windows — the real trick of night rain.
- The city breathes: on a seeded schedule a lit window somewhere goes dark and
  another lights. Never all dark at once.
- One block cat per few chunks — stem-dark, pale eyes — sitting on ledges,
  walking a short seeded patrol, turning to watch the tram pass.
- The rails sing: a faint pale shimmer runs along them ~3 seconds before the
  tram arrives, and the two-note bell carries out of the fog before anything
  is visible.
- Behind the tram, its headlamps leave two brief pale streaks on the wet
  surface — the painting's foreground, alive and fading.

## 5. Activities (lore as substrate; all seeded, all endless)

1. **Catch the last tram — Успеть на трамвай.** The bell sounds somewhere in
   fog. Find a stop before the tram passes it; it waits seconds, and it moves
   just faster than you, so catching it means cutting corners between stops —
   a chase that ends in a ride. Riding settles the camera and scrolls the night
   by; step off at any stop, in chunks you have never seen.
2. **Walk the line — Пройти линию.** Follow the rails on foot between stops,
   counting poles; the count is each stop's name.
3. **Greet the windows — Горящие окна.** Stand a moment near a facade's one
   glowing window: it flares softly — greeted. A quiet, countless collection.
4. **Find the terminus — Найти конечную.** Rumour says the line has an end.
   It does not (it is seeded and infinite) — but looking for it finds you
   benches, lamps, cats, and the tram again, which is the point.
5. **Lamplight puddles — Лужи.** The pale streaks behind the tram fade in
   seconds; running the wake and stepping through them before they go dark is
   the tram-world's version of jumping puddles.

## 6. Key terms

последний рейс — the last run · линия — the line · остановка — tram stop ·
конечная — the terminus · депо — the depot · горящее окно — a lit window ·
столб — catenary pole · рельсы — the rails · звонок — the bell ·
мокрый асфальт — wet asphalt · ночной город — the night city

## 7. Three kitsch traps

1. **No blue.** The fogged window-blue died in sampling; do not smuggle a cyan
   back in for "rainy night mood" — that road ends in lo-fi neon. Here light is
   cream and night is brown-grey; the blue lives only in the painting.
2. **No face on the tram.** The headlamps are lamps and the 5 is a number. The
   tram has character because it waits, not because it has eyes.
3. **Not a dead city.** No broken glass, no flickering-lamp horror, no
   abandoned-place grading. It is 23:40, not the end of the world: warmth
   behind curtains, one tram still running, a driver who also wants to get
   home — melancholy that stays warm because everyone does.
