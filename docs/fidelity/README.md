# The Fidelity Court

Every generated asset that claims to come from one of his paintings is tried
here before it ships. The court exists because "meh" is real but not
actionable: its job is to turn felt wrongness into named, checkable defects
that drive the next attempt.

Two halves, in order:

## 1. The prompt court (before any credit is spent)

Every clause of a generation prompt must be traceable to either a mark in the
painting or a line in that world's lore brief (docs/lore/<slug>.md). A clause
that traces to neither is an invention and gets struck.

This is not bureaucracy; it is where the first sky failed. The poppy prompt
said "endless meadow… horizon dissolving" — the painting has NO horizon and no
sky, the ground is the weather edge to edge, and the lore brief said exactly
that. The model obeyed the prompt over the image, and a third of the result
came out in colours he never mixed. The defect was authored here, not in
Marble.

## 2. The verdict (after generation, before shipping)

Run `python3 tools/compare-pano.py <painting> <generated> <prefix>` and then
judge the contact sheet. Seven axes, each answered in writing:

1. **Palette** (measured): share-weighted Lab distance from the tool.
   Ship bar: no single colour above 15% share may be FOREIGN (dE > 20).
2. **Facture** — the soul axis made operational: at crop scale, would the
   marks pass as the same hand? Name the difference (impasto vs illustration,
   knife vs pen, wet-into-wet vs clean outline).
3. **Provenance of elements** — list what the generation contains that the
   painting does not. Check each against the lore brief; unlisted inventions
   are defects.
4. **Signature texture** — every painting has one (poppy: the spatter;
   pagoda: wet-into-wet mist; gravity: hatching). Present, or smoothed away?
5. **Value structure** — where the darks and lights sit, compared honestly.
6. **Scale story** — does it read at the world's intended scale?
7. **Blind pair** — final question, yes/no: could these crops hang in the
   same room as the same artist's work without anyone asking?

Verdict is one of SHIP / ITERATE (with the exact prompt change) / REJECT.
Every attempt gets a numbered log in this directory: <slug>-sky-NNN.md.
Nothing ships without a log.
