# alexandrgoriainov.com — rebuild plan

**Status:** all open items resolved; executing from Gate 0.
**Canonical URL:** `https://alexandrgoriainov.com/` — sole domain. The typo
variant `alexandgoriainov.com` is deliberately **not** registered.
**Author:** drafted 2026-08-26 after a full read of the repo, the live site, the
14 paintings, the Cloudflare Pages config, and the school's public record.

---

## 0. What this is

Alexandr Goriainov is Tim's younger brother. He is in class 5В at
**МБОУ «Гимназия № 4», Kursk**. He paints, and he wins olympiads in four
different subjects. The site he has today is a Three.js scaffold with a Lego
minifigure, placeholder achievements copied from a tutorial, and a hard block on
every phone.

This plan turns it into what it was always trying to be: **a world you walk
through, where every painting is a door into another world.**

Two rules govern everything below.

1. **The paintings are real objects.** They are photographs of physical
   canvases, paper and glass made by a child. No step in this plan is allowed to
   repaint them. Restoration is deterministic and reversible; anything
   generative touching the artwork itself requires an explicit approval with a
   side-by-side at 100% zoom.
2. **No credits are spent without a named, approved gate.** Balance is
   **282.45** as of 2026-08-26. Every spend below is itemised, and every batch
   is preceded by a single-item pilot.

---

## 1. The verified record (replaces all placeholder content)

Found on the school's public VK wall (`vk.com/wall-187733677_*`). Five results,
all his, all confirmed by name and class. Three other hits for "Горяйнов
Александр" on the same wall are a **different person** — Александр Николаевич
Горяйнов, a retired lieutenant-colonel who chairs the district veterans'
council. Do not merge them.

| # | Result | Competition | Level | Class |
|---|---|---|---|---|
| 1 | **Winner** (победитель) | Oblast Olympiad in **Mathematics**, regional stage | Regional | 5В |
| 2 | **Winner** (победитель) | **«День Кулибина»** — Day of the Entertaining Experiment, young inventors & technicians, at SWSU (ЮЗГУ), Kursk | University-hosted, city + oblast entrants | 5В |
| 3 | **Prize-winner** (призёр) | All-Russian Olympiad for Schoolchildren in **Economics**, municipal stage — **sat the Year 7 paper while in Year 5** | Municipal | 5В |
| 4 | **Prize-winner** (призёр) | **«Эстафета знаний – 2026»** intellectual tournament, natural-sciences track, **Chemistry** | Inter-school | 5В |
| 5 | **Prize-winner** (призёр) | Regional olympiad for Year 4, **Mathematics** | Regional | 4В |

Teachers are named in the source posts. **Decided: not credited on the site** —
they did not ask to be published on a pupil's personal page. Kept here only so
the record is complete.

**Name, settled:** English **Alexandr Goriainov**, Russian **Александр
Горяйнов**. Both are correct in their own language; neither is a transliteration
of the other. This is a per-locale value in the content model, not a global
constant — the same is true of the school name and the competition titles.

**Born 2 September 2014, Kursk.** He turns **12 on 2 September 2026** — seven
days after this plan was written. See §6 on shipping.

**Decided — what the site publishes about a child.** Full name, city, school
name, the five results, and the year each was won. **Not published:** his class
letter (5В) and his exact date of birth. Name + exact school + exact class + DOB
is enough to locate a specific child in Kursk; the year alone carries the same
meaning for a reader and none of the risk. This applies to the rendered site,
the structured data, the OG tags and the source JSON alike — the class letter and
the DOB never enter the content model at all, so they cannot leak later by
accident. This document is the only place they are written down.

**Art prizes:** none public, and Tim confirms none known for now. To be
re-checked later; the content model leaves the slot open.

### 1.1 Profile — draft, English

> Alexandr Goriainov was born in 2014 in Kursk. He is a pupil at Gymnasium No. 4,
> where he wins olympiads in four different subjects and builds machines that
> work.
>
> In 2026 he took first place in the regional mathematics olympiad and first
> place at «День Кулибина», a young inventors' competition judged at Southwest
> State University. He was a prize-winner in chemistry, and in economics — where
> he sat the Year 7 paper two years early.
>
> He also paints. Oil, watercolour, graphite, ink, and once on glass. Fourteen of
> those paintings hang in this gallery, and every one of them is a door.

Russian version to be written natively rather than translated — see §3.6. **Both
versions are placeholders until Alexandr sends his own words**, at which point
this profile is replaced, not edited.

---

## 2. Everything that is wrong today

A complete list. Each item has an owner phase; nothing here gets dropped.

### Blocking — mobile
| # | Defect | Location | Phase |
|---|---|---|---|
| B1 | Whole app replaced by "Desktop Experience Required" on any touch device | `src/App.tsx:45` | 1 |
| B2 | No touch/pointer input exists at all — only `keydown`/`keyup` | `src/hooks/useInput.ts:36` | 1 |
| B3 | Camera can never rotate on any device — fixed offset + `lookAt` | `src/components/3D/Player/CameraController.tsx` | 1 |
| B4 | Controls panel is a fixed desktop-width bar; overflows a phone | `src/components/UI/Controls/ControlsPanel.tsx` | 1 |

### Blocking — performance
| # | Defect | Detail | Phase |
|---|---|---|---|
| P1 | 17 MB of raw PNG loaded eagerly as 14 uncompressed textures (~80 MB VRAM) | `public/assets/art/`, `ArtGallery.tsx:24` | 4 |
| P2 | A second, unused 17 MB copy of the same files | `ART/` | 4 |
| P3 | No loading screen ever shows — `LoadingScreen` sits behind a `Suspense` that never suspends; Canvas fallback is `null` | `App.tsx:87,96` | 1 |
| P4 | Movement is frame-rate dependent — `position.add(velocity)` with `delta` destructured and unused. 120 Hz phone = double speed | `LegoPlayer.tsx:65` | 1 |

### Correctness
| # | Defect | Detail | Phase |
|---|---|---|---|
| C1 | **Every portrait painting is stretched to square** — textures mapped onto a `3.5 × 3.5` face | `ArtGallery.tsx:71` | 6 |
| C2 | Section positions double-applied: easels land at z=40 not z=20, trophies at z=-47 not z=-20 | `ArtGallery.tsx:131`, `AchievementsSection.tsx:75` | 6 |
| C3 | Consequence of C2 — stand at the trophies and the header still says "Welcome to My World!" | `useCurrentSection.ts:13` | 6 |
| C4 | Gallery ground cylinder (r=60 at z=20) extends to z=80, past both the world bound (60) and the ground plane edge | `ArtGallery.tsx:151` | 6 |
| C5 | Emoji in drei `<Text>` render as blank boxes — Inter has no emoji glyphs | all `Sections/*` | 6 |
| C6 | Artwork titles face +Z only, no billboarding — unreadable from three sides | `ArtGallery.tsx:99` | 6 |
| C7 | Section polling on a 100 ms `setInterval` instead of the frame loop | `useCurrentSection.ts:26` | 6 |

### Content & compliance
| # | Defect | Detail | Phase |
|---|---|---|---|
| N1 | All five achievements are tutorial placeholders ("Spelling Bee Champion", "Math Olympiad Gold Medal", "Science Fair Winner") | `src/data/achievements.ts` | 2 |
| N2 | About text is generic filler | `src/data/content.ts` | 2 |
| N3 | **GA4 fires on load with no consent gate and no Consent Mode defaults** — a tracker on a minor's site, live in the EU | `public/index.html` | 3 |
| N4 | No OG image, no Twitter card, no structured data — link previews are blank | `public/index.html` | 8 |
| N6 | README is one line; no build/run docs | `README.md` | 0 |
| N7 | **Site is English-only.** No i18n layer, no locale routing, no `hreflang`, no `lang` switching. His school, teachers and family read Russian | whole app | 2 |
| N8 | **`react-scripts` 5.0.1 — CRA was deprecated Feb 2025** and has had no security patches since. `craco` is a patch on top of an unmaintained tool | `package.json` | 0.5 |
| N9 | Dates, numbers and name order are hard-coded English; no `Intl` usage | `src/data/*` | 2 |
| N10 | **Tailwind has never run in production** — the `@tailwind` directives ship to the browser unprocessed, so all 24 `className` attributes across 4 components are dead | `craco.config.js` | 0.5 ✅ |

---

## 3. The design

### 3.1 Structure

Five flat valleys become three layers.

```
  THE ATELIER  (spawn — a room, not a field)
      │  his desk, his real awards as working objects,
      │  the About and Contact panels, the window
      ▼
  THE GALLERY  (hub — "Cosmic Threads" made navigable)
      │  the black void; 14 painted planets strung on white threads;
      │  each planet is a portal frame
      ▼
  14 WORLDS  (one per painting)
```

**Why Cosmic Threads is the hub:** it already *is* the diagram. Distinct
textured spheres, each its own world, connected by white tendrils — he painted
the site map before the site existed. Nothing else in the collection is
structured that way.

**Why an Atelier and not a field:** a room reads instantly on a 6-inch screen.
The current 120×120-unit grass plane is mostly empty space you have to cross.

### 3.2 The portals

drei's `MeshPortalMaterial`. Each frame renders its own scene; walking close
lerps `blend` 0→1 and you cross without a page load. This is the mechanism the
"go through the portal" idea needs, and it is well-trodden.

### 3.3 The avatar — "the painted boy"

Replace the Lego minifigure. One low-poly character, and **one shader trick that
carries the whole concept**: the avatar's surface is not a texture, it is
*whatever medium the current world is made of.*

- In the graphite worlds he becomes pencil hatching.
- In the impasto seascapes he becomes thick oil strokes.
- In the ink cosmos he becomes crosshatching.
- In the watercolour worlds he becomes bleeding washes.

One mesh, one material, a per-world uniform. Cheap on a phone, and it makes
"every painting is a world" true *of the player*, not just the scenery.

### 3.4 The achievements become objects on his desk

No trophy cones. Five things you can pick up:

| Award | Object |
|---|---|
| Mathematics, regional winner | a brass compass and straightedge; drawn constructions hang in the air above it |
| «День Кулибина», winner | a small machine on the desk that actually runs |
| Economics, prize (Year 7 paper in Year 5) | a balance scale, weighted wrong on purpose, that still balances |
| Chemistry, prize | a flask that genuinely bubbles |
| Year 4 mathematics, prize | the same compass, smaller, worn — the first one |

### 3.5 The fourteen worlds

Derived from the paintings, not invented around them.

| Painting | World |
|---|---|
| Cosmic Threads | **the hub** — the void and the threads |
| When Gravity Sleeps | the ink cosmos; hatching falls as rain; a floating island; everything is line |
| Sailing the Divide | a sky split serene/storm; you sail the seam |
| Headwind | slate monochrome sea, wind pressure, impasto foam |
| Three Sails at Dusk | three sails as candles; the birds are the only motion |
| Tide Wanderer | underwater watercolour; the turtle is the size of a building |
| Clockwork Fish | a stained-glass machine room; gears turn behind the glass |
| Last Run of Tram No. 5 | a wet night street; one red tram; everything else is fog |
| Pagoda in Red Weather | crimson mist, a silhouette, drifting wet-into-wet |
| Poppy in Green Weather | insect scale; the flower is architecture |
| Weight of a Whisper | a violet void, one enormous metal feather, near-zero gravity |
| Desert Table, Curved Voices | a giant tabletop; the pitchers are towers |
| Cup & Apple + Vessel with Shadow | **the Drawing Room** — the two graphite studies share one colourless world |

Twelve worlds from fourteen paintings (Cosmic Threads is the hub, the two
graphite studies share a room). Worlds ship **one at a time**, each behind its
own approval.

### 3.6 Language and region

Two separate systems, routinely confused, kept apart here.

**Language** is what the content is written in. **Region** is where the visitor
is, and it controls only three things: which language we *suggest* on first
visit, how dates and numbers format, and which consent regime applies.

**Locale routing.** Path-prefixed, one real URL per language, every one
returning HTTP 200:

```
  /            → x-default, the language chooser + English content
  /en/…        → English
  /ru/…        → Russian
  /<xx>/…      → every future language, same shape
```

Each page carries the full `hreflang` cluster plus `x-default`. This is
non-negotiable for indexing: a locale URL that 301s to another locale makes
Google discard the `hreflang` entirely and report a conflict.

**How it is built.** Vite + a prerender step that emits a real `index.html` per
locale with the correct `<title>`, `<meta name="description">`, `og:locale`,
`<html lang>` and hreflang block baked in. Static files, no runtime cost, ideal
for Pages. A client-only SPA that swaps strings after load cannot be indexed per
language, which is the whole point of doing this.

**Region detection.** Cloudflare gives `CF-IPCountry` on the free plan. A Pages
Function reads it on the bare `/` request and *suggests* a language — a
dismissible bar, never a forced redirect, and the choice is remembered. Forced
geo-redirects break crawlers and infuriate anyone travelling.

**Adding language number three must cost one file.** A `locales.ts` manifest is
the single source of truth; the prerender, the sitemap, the hreflang cluster and
the switcher all derive from it. Adding `de` = one JSON catalogue + one manifest
line.

**Decided: ship `ru` + `en` only.** A third language is built-for-later, not
built. The manifest, the prerender and the switcher are written to take N locales
from day one — but we do not ship a language nobody has asked for, and we do not
ship a machine translation to pad the count.

**Plurals are not string interpolation.** Russian has three plural forms
(1 победа / 2 победы / 5 побед). ICU MessageFormat via `i18next-icu`, not
hand-rolled ternaries.

**Authored vs translated, and we say which.** Russian and English are *authored*
— his own words in Russian, and a careful English version reviewed by Tim.
Any further language is machine-translated and **labelled as such** on the page.
Claiming a machine translation is the artist's own voice would be a lie about a
child's words.

**Text inside the 3D scene.** drei's `<Text>` is troika, which parses a real font
file at runtime and builds SDF glyph atlases on demand. It handles Cyrillic,
bidirectional layout, joined scripts like Arabic, and falls back for unicode it
lacks — so the 3D world can speak every language the UI does. Two consequences:
pick a display font with genuine Latin **and** Cyrillic coverage rather than
relying on fallback (which looks visibly mismatched), and drop emoji from 3D text
entirely (defect C5) in favour of real geometry.

**Right-to-left** is not needed today, but the layout uses logical CSS properties
(`margin-inline`, `padding-block`) from the start so that adding Arabic or Hebrew
later is a font choice, not a rewrite.

---

## 4. Phases

Each phase is a branch and a PR. Nothing merges without your review.
**⛔ = hard stop, needs your approval before I continue.**
**💳 = spends credits, itemised.**

### Phase 0 — Foundations *(no spend)*
- Working copy at `~/sub-projects/alexandr-website`; branch off `main`.
- Pin the toolchain to node@22 (`.nvmrc` + a note) — system node is broken
  (`libsimdutf.34.dylib`) and nobody will guess that.
- Verify `npm ci && npm run build` reproduces the deployed bundle.
- Write a real `README.md` (N6).
- Delete the duplicate `ART/` folder from the build path but keep the originals
  archived outside `public/` (P2).
- ⛔ **Gate 0:** confirm the build reproduces before anything else.

### Phase 0.5 — Off Create React App *(no spend)*
Not scope creep; a prerequisite for two other phases, and it happens **before**
Phase 1 so the touch work is not built twice.

- CRA was deprecated in **February 2025** and `react-scripts` has had no security
  patches since. `craco` is a patch on an unmaintained tool (N8).
- Per-locale prerendered HTML (§3.6) is not achievable on CRA's fixed build.
- The KTX2/Basis texture pipeline of Phase 4 needs a real plugin system.
- Three.js iteration on CRA is slow enough to materially cost time across
  fourteen worlds.

Migrate to **Vite**: drop `react-scripts` + `craco`, move `index.html`, rename
`REACT_APP_*` → `VITE_*`, swap `process.env` for `import.meta.env`. Update the
Cloudflare Pages build output directory from `build` to `dist`.
- ⛔ **Gate 0.5:** byte-comparable behaviour on desktop before we touch anything
  else. If the migration turns ugly, we abandon it and stay on CRA — Phases 1–3
  can be delivered either way, at the cost of a worse Phase 2 and 4.

### Phase 1 — Make it work in his hand *(no spend)*
This is the phase you actually asked for. Ship it on its own.
- Delete the desktop gate; `MobileDisclaimer` is removed, not bypassed (B1).
- **Tap to move.** Tap the ground → the boy walks to that point. Exactly the
  behaviour from the original inspiration (B2).
- **Double-tap to jump** (B2).
- **Drag to look.** One-finger drag orbits the camera; the camera can finally
  turn (B3).
- Optional thumbstick for held movement, off by default, toggleable.
- Delta-time the movement so a 120 Hz phone matches a 60 Hz laptop (P4).
- Real loading screen with actual progress (P3).
- Responsive controls hint that adapts to touch vs keyboard (B4).
- Mobile render budget: capped pixel ratio, shadows off on touch, reduced-motion
  respected.
- ⛔ **Gate 1:** you open it on your phone and on his. If it isn't fun to move
  around, we fix that before adding a single world.

### Phase 2 — Truth, in every language *(no spend)*
The largest non-3D phase, because it is two jobs: replacing the fiction, and
building the machine that lets the site speak.

**2a — the content model.**
- Delete `achievements.ts` and `content.ts` as hard-coded English (N1, N2, N9).
- Replace with locale-keyed catalogues: `locales/en/*.json`, `locales/ru/*.json`,
  driven by a `locales.ts` manifest (§3.6).
- Every fact that differs by language is a per-locale value, not a translation:
  his name, the school's name, the competition titles. «День Кулибина» is not
  "Kulibin Day" in Russian — it is its actual name, and English gets a gloss.
- Dates and numbers via `Intl`, never string-formatted (N9).

**2b — the i18n layer.**
- `react-i18next` + `i18next-icu` for Russian's three plural forms.
- Path-prefixed routing `/en/`, `/ru/`, root as `x-default` (N7).
- Per-locale prerender: real `<title>`, description, `og:locale`, `<html lang>`,
  full `hreflang` cluster + `x-default`, one sitemap per locale.
- A Pages Function reading `CF-IPCountry` to *suggest* a language on first visit
  — a dismissible bar, never a redirect.
- Language switcher that preserves your position in the world, not one that
  dumps you back at the door.

**2c — the words.**
- The five verified results (§1), written properly in both languages.
- The profile (§1.1) as a placeholder, replaced wholesale when Alexandr sends
  his own words in Russian. His Russian is the original; the English is the
  translation, and that is the honest direction of travel.
- Teacher credits, if he wants them.

- ⛔ **Gate 2a:** Tim reads the Russian. I can write it, but I am not the person
  who should sign off on how an 11-year-old's record reads in his own language.
- ⛔ **Gate 2b:** Alexandr approves every line about himself.

### Phase 3 — Cookie consent, region-aware *(no spend)*
Decision taken: **GA4 stays, behind consent.**

- Google **Consent Mode v2**: `analytics_storage`, `ad_storage`, `ad_user_data`,
  `ad_personalization` all defaulted to **denied**, set *before* the gtag snippet
  loads. Today the tag fires unconditionally on page load (N3).
- Region-aware behaviour, from the same `CF-IPCountry` signal as §3.6:
  - **EEA / UK / Switzerland** — opt-in. Nothing fires until Accept.
  - **Elsewhere** — still default-denied with a visible banner. Simpler, more
    defensible, and one code path instead of two.
- Banner in the site's own design, not a bought CMP widget: Accept / Reject /
  Details, **reject exactly as easy as accept**, choice stored locally,
  re-openable from a footer link.
- Fully translated like everything else — a consent banner a Russian visitor
  cannot read is not consent.
- Privacy note in plain language, both locales. It should be readable by a
  twelve-year-old, because one made the site.

### Phase 4 — Restoring the paintings 💳
The careful phase. Ordered so the free, truthful work happens first and you can
see how far it gets us before anything generative is considered.

**4a — deterministic, free, reversible.** Local Python/PIL + numpy.
- Perspective-deskew each photo (they are hand-held shots — the canvases lean).
- Crop to the painted edge; remove the wall, the table, the paper margin.
- Normalise white balance and exposure across the set so 14 photos taken under
  different lamps read as one collection.
- Keep every original untouched in an archive folder, forever.
- ⛔ **Gate 4a:** before/after contact sheet of all 14. **My expectation is that
  this alone does most of the work** — most of what looks wrong with these
  images is framing and colour cast, not resolution.

**4b — upscale, one pilot first.** 💳
- Model: `bytedance_image_upscale`, **2 credits**, 4K out. Non-generative
  super-resolution.
- **Pilot: one painting, 2 credits.** I produce a 100%-zoom side-by-side of
  brushwork before/after.
- ⛔ **Gate 4b:** you look at the brushstrokes. If the upscaler has smoothed his
  impasto into plastic, **we stop and ship 4a only.** That is a real possible
  outcome and it is fine.
- If approved: remaining 13 × 2 = **26 credits**.
- `topaz_image` (High Fidelity V2) is the fallback if Bytedance disappoints —
  but note its cost **cannot be estimated in advance** by the API, so it needs
  its own gate.
- **Never** `topaz_image_generative` / "Redefine" on his artwork. That variant
  repaints.

**4c — delivery pipeline, free.**
- Two derivatives per painting: a 2048px KTX2/Basis texture for the 3D canvases,
  and a full-resolution WebP for the fullscreen viewer.
- KTX2 cuts texture VRAM 4–6× — this is what actually fixes P1.
- Lazy-load: only the paintings near the player are resident.
- Aspect ratio preserved everywhere (C1).

**Phase 4 total: 2 credits to decide, 28 if fully approved.**

### Phase 5 — The avatar 💳
- Silhouette exploration first, as **flat sketches**, so we argue about the
  character before spending on renders.
- ⛔ **Gate 5a:** pick a silhouette.
- Concept sheet: `nano_banana_pro` @ 2 cr — front/side/back + two expressions.
  **~5 images = 10 credits.**
- ⛔ **Gate 5b:** approve the concept before any 3D.
- Mesh: `tripo_h3_1_image_to_3d` @ **9 credits**, one attempt, budget one retry.
- Rig + walk/idle/jump in Blender (installed, works — free).
- The per-world medium shader (§3.3) — hand-written, free.
- ⛔ **Gate 5c:** Alexandr approves his own avatar. Non-negotiable.
- **Phase 5 total: ~19–30 credits.**

### Phase 6 — The Portal Gallery *(no spend)*
- The Atelier, built by hand.
- The Cosmic Threads hub with 14 portal frames.
- `MeshPortalMaterial`, approach-to-blend crossing, and a return gesture.
- Fixes C1–C7 as a consequence of the rewrite, each verified individually.
- Achievement objects (§3.4) — modelled in Blender, free.
- **One world built end-to-end** as the proof: *When Gravity Sleeps*, because it
  is already a map and needs the least invention.
- ⛔ **Gate 6:** you and Alexandr walk through one portal. If the feeling isn't
  there, we redesign before multiplying by twelve.

### Phase 7 — The remaining worlds 💳
One world per PR. Each proposed, costed and approved on its own.
- Most worlds are geometry, palette, fog, particles and shaders — **free**.
- Where a world genuinely needs a generated backdrop: `nano_banana_pro` @ 2 cr,
  budget ~2 plates per world.
- A world with a true hero prop (the tram, the turtle, the clockwork fish):
  image-to-3D @ 9 cr, and only where hand-modelling in Blender would be worse.
- Depth-map parallax from the paintings themselves (free, local) is the **first**
  thing tried for every world — it uses his real brushwork instead of an AI
  imitation of it, and it is the highest-quality-per-credit option in this plan.
- ⛔ **Gate 7.n:** one gate per world, with its own credit line.
- **Ceiling: 120 credits across all eleven remaining worlds**, and I stop and
  ask if we approach it.

### Phase 8 — Finish *(no spend)*
- OG image + Twitter card + `Person`/`VisualArtwork` structured data (N4).
- Per-world ambient audio, muted by default.
- Accessibility: keyboard path preserved, reduced-motion honoured, a flat
  no-WebGL fallback gallery so the site is never a blank screen.
- Lighthouse pass on a real mid-range phone, not an emulator.

---

## 5. Budget

| Phase | Purpose | Credits |
|---|---|---|
| 4b pilot | one painting upscaled, to decide | **2** |
| 4b batch | remaining 13, only if the pilot passes | 26 |
| 5 | avatar concept + mesh | ~19–30 |
| 7 | world plates and hero props, gated per world | ≤120 |
| — | **reserve** | **≥104** |
| | **Balance today** | **282.45** |

Measured rates (2026-08-26, `higgsfield generate cost`): nano_banana_flash 1.5,
nano_banana_pro 2, seedream_v5_pro 3, bytedance_image_upscale 2,
tripo_h3_1_image_to_3d 9, hunyuan3d_v3_image_to_3d 11, Kling 5 s 10,
Seedance 8 s/1080p 72. `topaz_image` cannot be pre-estimated.

**No video.** One Seedance plate is 72 credits — a quarter of the balance for
eight seconds. Not worth it here.

Higgsfield has **no 360/equirectangular model**. If a world needs a true skybox,
that is Blockade Labs Skybox AI at ~$20/month, and I will ask before assuming it.

---

## 6. Order of shipping

Phases 0.5, 1, 2 and 3 are independent of the 3D ambition and fix what is
actually broken. **They ship as separate deploys** — the site is working on a
phone, truthful, bilingual and lawful long before the first portal exists.

**There is a deadline worth using.** He turns 12 on **2 September 2026**, seven
days out. Phase 1 alone — the site working in his hand, in Russian — is a
realistic birthday deploy and a far better present than a promise about portals.
I would aim Phases 1 + 2c at that date and let 0.5, 2a/2b and 3 land right after.

Phases 4–7 are the ambition, and they ship one gate at a time.

---

## 7. Open items

**All resolved.**

| Item | Decision |
|---|---|
| Name | `en` Alexandr Goriainov · `ru` Александр Горяйнов — per-locale values |
| Born | 2 Sept 2014 (site shows **year only**) |
| Languages | `ru` + `en` now; architecture takes N locales; third language later |
| Teacher credits | No |
| School detail | Name + city + results + year. **No class letter, no DOB.** |
| GA4 | Kept, behind Consent Mode v2, default denied |
| Repo | Stays public |
| Domain | `https://alexandrgoriainov.com/` only; typo domain not registered |
| Alexandr's own words | Pending — §1.1 ships as a marked placeholder until then |

---

## 8. Execution log

**2026-08-26 — Gate 0: PASSED.**

`npm ci && npm run build` under node@22 reproduces the live site **byte for
byte**:

| Artefact | Live | Local | |
|---|---|---|---|
| `main.b6c24e3b.js` | 1 374 711 B · `6c3215706d35f8ac` | 1 374 711 B · `6c3215706d35f8ac` | identical |
| `main.d221ebf1.css` | 976 B · `f7c7db6f9a7994cd` | 976 B · `f7c7db6f9a7994cd` | identical |

The working copy is therefore a trustworthy baseline: any future difference on
the live site is a change we made, not drift.

**Measured while there — evidence for Phase 0.5 (N8).** `npm audit` on the
current dependency tree: **58 vulnerabilities — 3 critical, 29 high, 14
moderate, 12 low**, across 32 packages including `lodash`, `express`,
`node-forge`, `path-to-regexp`, `nanoid`, `minimatch` and the whole `@svgr`
chain. These are transitive dependencies of `react-scripts@5.0.1`, which has
been unpatched since Feb 2025. They cannot be fixed while CRA remains: the
upgrade path *is* Phase 0.5.

Note the practical risk here is low — a static site with no server, no user
input and no secrets — but it is unfixable-in-place, and it will only grow.

**2026-08-26 — Phase 0 complete.** `chore` — node 22 pinned (`.nvmrc` +
`engines`), `ART/` renamed to `art-originals/` and documented as the masters
(its 14 files verified byte-identical to `public/assets/art/`), the 2025 design
doc and CRA boilerplate readme moved into `docs/`, real README written.

**2026-08-26 — Phase 0.5 complete. Gate 0.5 open — needs a decision.**

Migrated to Vite 8. `react-scripts` + `craco` out; TypeScript 4.9.5 → 5.9.3
(`moduleResolution: bundler` needs 5.0), `@types/node` 16 → 22 (blocked the Vite
install). `build.outDir` deliberately left as `build/`, so **the Cloudflare Pages
project needs no change at all.**

| | Before | After |
|---|---|---|
| `npm audit` | 58 — 3 critical, 29 high | 6, all dev-only |
| `npm audit --omit=dev` | — | **0 vulnerabilities** |
| Build time | ~40 s | **1.16 s** |
| JS, gzipped | 377.25 kB | 375.55 kB |
| Tests | 1, and it was broken | 16, all passing |

**N10 — DISCOVERED: Tailwind has never run in production.**

The deployed `main.d221ebf1.css` is 976 bytes and begins with the literal text
`@tailwind base;@tailwind components;@tailwind utilities;`. The directives were
shipped to the browser unprocessed. Grepping the live file for `.flex`,
`.fixed`, `.absolute`, `.rounded`, `.z-30`, `.pointer-events-none` returns **0
for every one**. Vite's output is 10,640 bytes and returns 1 for each.

Every Tailwind class in the app has therefore been dead since the first deploy.
Four components depend on them — 24 `className` attributes across `App.tsx`,
`ControlsPanel`, `LoadingScreen`, `SectionLabel`. The layout classes are the
damage:

- `ControlsPanel` — `fixed bottom-6 left-1/2 z-30`, never fixed-positioned.
- `SectionLabel` — `fixed top-6 left-1/2 z-40`, never fixed-positioned.
- `App.tsx` overlay — `absolute top-0 left-0 w-full h-full z-10`, never
  absolute. It sits in normal flow after a 100vh canvas, inside a `#root` that
  is `height:100vh; overflow:hidden` — clipped out of view.

This retires the "byte-comparable" criterion for Gate 0.5: the CSS **must**
change, because it was wrong. It also revises defect B4 — the controls panel
does not overflow a phone, it is not visible at all.

⛔ **Gate 0.5 needs a look at the running site, not a diff.** The HUD is about
to appear where it was always designed to sit, and nobody has ever seen it
there. Run `npm run dev` and compare against production before this merges.

**Next:** Phase 1 — mobile.
