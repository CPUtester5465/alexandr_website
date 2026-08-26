import * as THREE from 'three';
import palettes from '../generated/palettes.json';
import { DIMENSIONS } from './registry';

/**
 * Every world, as a parameter set.
 *
 * A dimension is not a modelled scene. It is a palette sampled from a painting
 * plus a dozen numbers, so adding the next one is an afternoon of tuning rather
 * than a build. That is the whole reason the generator exists.
 *
 * The palettes are not chosen and neither, mostly, is the terrain: the shape of
 * each world is derived from what its painting actually is. A seascape gets low
 * amplitude and long wavelengths. An ink cosmos gets ridged noise and spires. A
 * graphite still life gets almost no relief at all, because the painting has
 * almost no depth in it.
 *
 * Four of the fourteen come back genuinely monochrome from sampling, because
 * they are graphite and ink. Those worlds are grey. That is not a gap to be
 * filled in later -- it is what he drew.
 */

export type StructureKind = 'flower' | 'pillar' | 'none';

export interface DimensionSpec {
  slug: string;
  painting: string;
  title: { en: string; ru: string };
  seed: number;
  /** Sampled hexes, most-used first. */
  palette: string[];
  colours: THREE.Color[];
  blocks: {
    surface: number; deep: number; pale: number;
    stem: number; accent: number; accentLit: number; core: number;
  };
  terrain: {
    base: number;
    amplitude: number;
    frequency: number;
    octaves: number;
    ridged: boolean;
    warpFrequency: number;
    warpStrength: number;
  };
  structure: {
    kind: StructureKind;
    /** Blocks between candidate sites. */
    spacing: number;
    /** 0..1 chance a site is used. */
    density: number;
    minHeight: number; maxHeight: number;
    minRadius: number; maxRadius: number;
  };
  sky: number;
  fog: { near: number; far: number };
  /** Everything he arrives with. Physics differ per world on purpose. */
  physics: { gravity: number; speed: number };
}

const P = palettes as Record<string, { hex: string }[]>;

/** Block ids are the same in every world; only the colours behind them change. */
const BLOCKS = { surface: 1, deep: 2, pale: 3, stem: 4, accent: 5, accentLit: 6, core: 7 };

interface Recipe {
  slug: string;
  terrain: Partial<DimensionSpec['terrain']>;
  structure: Partial<DimensionSpec['structure']>;
  /** Which palette entries fill which role. Indices into the sampled list. */
  roles?: { surface?: number; deep?: number; pale?: number; stem?: number; accent?: number; accentLit?: number; core?: number };
  fog?: { near: number; far: number };
  physics?: Partial<DimensionSpec['physics']>;
  skyIndex?: number;
}

/** Rolling meadow, giant flowers -- the reference world. */
const MEADOW: Recipe['terrain'] = {
  base: 6, amplitude: 5, frequency: 0.045, octaves: 4, ridged: false,
  warpFrequency: 0.05, warpStrength: 6
};
/** Long low swells, almost no vertical. For the seascapes. */
const SWELL: Recipe['terrain'] = {
  base: 4, amplitude: 2.4, frequency: 0.02, octaves: 3, ridged: false,
  warpFrequency: 0.03, warpStrength: 9
};
/** Crests and spires. Ridged noise makes ridges, not lumps. */
const RIDGE: Recipe['terrain'] = {
  base: 7, amplitude: 11, frequency: 0.03, octaves: 5, ridged: true,
  warpFrequency: 0.04, warpStrength: 7
};
/** Table-flat, because a still life is. */
const STILL: Recipe['terrain'] = {
  base: 3, amplitude: 0.9, frequency: 0.015, octaves: 2, ridged: false,
  warpFrequency: 0.02, warpStrength: 3
};

const FLOWERS: Recipe['structure'] = {
  kind: 'flower', spacing: 11, density: 0.72, minHeight: 7, maxHeight: 13, minRadius: 3, maxRadius: 4
};
const SPARSE_FLOWERS: Recipe['structure'] = {
  kind: 'flower', spacing: 17, density: 0.5, minHeight: 5, maxHeight: 9, minRadius: 2, maxRadius: 3
};
const PILLARS: Recipe['structure'] = {
  kind: 'pillar', spacing: 13, density: 0.6, minHeight: 6, maxHeight: 18, minRadius: 1, maxRadius: 1
};
const NOTHING: Recipe['structure'] = {
  kind: 'none', spacing: 20, density: 0, minHeight: 0, maxHeight: 0, minRadius: 0, maxRadius: 0
};

const RECIPES: Recipe[] = [
  { slug: 'poppy', terrain: MEADOW, structure: FLOWERS,
    roles: { surface: 0, deep: 1, pale: 4, stem: 1, accent: 3, accentLit: 2, core: 5 },
    fog: { near: 60, far: 320 } },

  // A sky split in two. Long swells, and the fog takes the far half.
  { slug: 'divide', terrain: SWELL, structure: PILLARS,
    roles: { surface: 4, deep: 0, pale: 5, stem: 4, accent: 2, accentLit: 3, core: 1 },
    fog: { near: 40, far: 380 }, skyIndex: 1 },

  // Near-zero gravity, one enormous feather. Violets throughout.
  { slug: 'whisper', terrain: RIDGE, structure: PILLARS,
    roles: { surface: 1, deep: 5, pale: 3, stem: 0, accent: 2, accentLit: 3, core: 4 },
    physics: { gravity: 16, speed: 15 }, fog: { near: 30, far: 240 } },

  { slug: 'desert-table', terrain: MEADOW, structure: SPARSE_FLOWERS,
    roles: { surface: 1, deep: 4, pale: 2, stem: 1, accent: 0, accentLit: 3, core: 2 },
    fog: { near: 55, far: 300 } },

  // Watercolour, underwater. Slow and floaty.
  { slug: 'tide', terrain: SWELL, structure: SPARSE_FLOWERS,
    roles: { surface: 5, deep: 2, pale: 1, stem: 5, accent: 4, accentLit: 3, core: 0 },
    physics: { gravity: 26, speed: 14 }, fog: { near: 20, far: 190 }, skyIndex: 2 },

  { slug: 'pagoda', terrain: RIDGE, structure: PILLARS,
    roles: { surface: 2, deep: 1, pale: 5, stem: 1, accent: 0, accentLit: 4, core: 3 },
    fog: { near: 25, far: 200 } },

  { slug: 'tram', terrain: STILL, structure: PILLARS,
    roles: { surface: 0, deep: 2, pale: 5, stem: 1, accent: 3, accentLit: 4, core: 1 },
    fog: { near: 18, far: 150 } },

  { slug: 'clockwork-fish', terrain: RIDGE, structure: PILLARS,
    roles: { surface: 2, deep: 4, pale: 0, stem: 3, accent: 1, accentLit: 5, core: 3 },
    fog: { near: 40, far: 260 } },

  { slug: 'three-sails', terrain: SWELL, structure: PILLARS,
    roles: { surface: 3, deep: 4, pale: 2, stem: 5, accent: 1, accentLit: 0, core: 5 },
    fog: { near: 35, far: 280 } },

  // Wind pushes back here. Slate monochrome, hard swells.
  { slug: 'headwind', terrain: SWELL, structure: NOTHING,
    roles: { surface: 3, deep: 2, pale: 0, stem: 2, accent: 4, accentLit: 5, core: 1 },
    physics: { gravity: 54, speed: 13 }, fog: { near: 30, far: 240 } },

  // The two graphite studies are a calm: flat, quiet, colourless.
  { slug: 'cup-apple', terrain: STILL, structure: NOTHING,
    roles: { surface: 0, deep: 2, pale: 1, stem: 4, accent: 3, accentLit: 1, core: 5 },
    fog: { near: 40, far: 260 } },
  { slug: 'vessel', terrain: STILL, structure: NOTHING,
    roles: { surface: 0, deep: 2, pale: 3, stem: 4, accent: 1, accentLit: 3, core: 5 },
    fog: { near: 40, far: 260 } },

  // The ink cosmos. Spires, low gravity, hatching grey.
  { slug: 'gravity', terrain: RIDGE, structure: PILLARS,
    roles: { surface: 1, deep: 5, pale: 3, stem: 4, accent: 2, accentLit: 0, core: 5 },
    physics: { gravity: 20, speed: 17 }, fog: { near: 45, far: 300 } },

  { slug: 'cosmic-threads', terrain: RIDGE, structure: PILLARS,
    roles: { surface: 0, deep: 4, pale: 2, stem: 1, accent: 3, accentLit: 2, core: 5 },
    fog: { near: 25, far: 220 } }
];

function buildSpec(recipe: Recipe): DimensionSpec {
  const entry = DIMENSIONS.find((d) => d.slug === recipe.slug);
  if (!entry) throw new Error(`No registry entry for dimension "${recipe.slug}"`);

  const hexes = (P[entry.painting] ?? []).map((c) => c.hex);
  const pick = (i: number | undefined, fallback: number) =>
    new THREE.Color(hexes[i ?? fallback] ?? hexes[0] ?? '#888888');

  const roles = recipe.roles ?? {};
  const colours: THREE.Color[] = [];
  colours[BLOCKS.surface] = pick(roles.surface, 0);
  colours[BLOCKS.deep] = pick(roles.deep, 1);
  colours[BLOCKS.pale] = pick(roles.pale, 2);
  colours[BLOCKS.stem] = pick(roles.stem, 1);
  colours[BLOCKS.accent] = pick(roles.accent, 2);
  colours[BLOCKS.accentLit] = pick(roles.accentLit, 3);
  colours[BLOCKS.core] = pick(roles.core, 4);

  return {
    slug: entry.slug,
    painting: entry.painting,
    title: entry.title,
    // Every world seeded from his birthday plus its own name, so each is
    // different and all of them are reproducible.
    seed: 20140902 + recipe.slug.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 7) % 100000,
    palette: hexes,
    colours,
    blocks: BLOCKS,
    terrain: { ...(MEADOW as DimensionSpec['terrain']), ...recipe.terrain },
    structure: { ...(NOTHING as DimensionSpec['structure']), ...recipe.structure },
    sky: parseInt((hexes[recipe.skyIndex ?? 0] ?? '#888888').slice(1), 16),
    fog: recipe.fog ?? { near: 45, far: 300 },
    physics: { gravity: 54, speed: 18, ...recipe.physics }
  };
}

export const SPECS: DimensionSpec[] = RECIPES.map(buildSpec);

export function specBySlug(slug: string): DimensionSpec | undefined {
  return SPECS.find((s) => s.slug === slug);
}
