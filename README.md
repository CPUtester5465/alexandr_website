# alexandrgoriainov.com

A 3D portfolio for Alexandr Goriainov — a schoolboy from Kursk who wins
olympiads in mathematics, chemistry and economics, builds machines that work,
and paints.

Fourteen of his paintings hang in the gallery. The long-term aim is that every
one of them is a door into a world built from that painting.

**Live:** https://alexandrgoriainov.com/

---

## Running it

**Node 22 is required, and the reason is not obvious.** On the current dev
machine the system `node` is broken system-wide — every invocation dies with
`dyld: Library not loaded: libsimdutf.34.dylib`, because Homebrew's `simdutf`
was bumped to a version whose soname no longer matches. Node 22 is a keg-only
install and is unaffected:

```sh
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"   # macOS, until brew is fixed
node -v                                             # expect v22.x
```

`.nvmrc` pins the major version for anyone using nvm.

```sh
npm ci        # install exactly the locked tree
npm start     # dev server
npm run build # production build → build/
```

The build is **byte-reproducible** against production — verified 2026-08-26,
`main.b6c24e3b.js` and `main.d221ebf1.css` hash-identical to the deployed files.
If your build differs, something changed.

---

## Deployment

Cloudflare Pages project **`alexandr-website`**, on the account that also serves
`altineris.com` and `devclusterai.com`.

| | |
|---|---|
| Repo | `CPUtester5465/alexandr_website` (public) |
| Production branch | `main` — pushes deploy automatically |
| Build command | `npm run build` |
| Output directory | `build` |
| Domain | `alexandrgoriainov.com` |
| Analytics | GA4 `G-9DKDT8N2Z7` |

---

## Layout

```
art-originals/    the fourteen master photographs — never modified, never served
docs/
  PLAN.md         the rebuild plan: phases, defects, budget, decisions
  ORIGINAL-SPEC.md the 2025 design document this was first built from
public/assets/art/ artwork as currently served (becomes generated in Phase 4)
src/
  components/3D/  scene, player, camera, environment, sections
  components/UI/  HUD, popups, controls
  data/           achievements, artworks, prose
  hooks/          input, animation state, current section
  utils/          three.js helpers, constants, device detection
```

---

## Where to start reading

**[`docs/PLAN.md`](docs/PLAN.md).** It carries the full rebuild plan — every
known defect numbered and assigned to a phase, the design for the portal
gallery, the language/region architecture, the artwork restoration pipeline, the
generation budget, and the decisions already taken.

Do not start work here without reading it. Several things that look like
oversights are deliberate, and several things that look fine are broken — the
site currently refuses to run on any phone at all, and that is the first thing
being fixed.
