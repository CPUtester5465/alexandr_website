import palettes from '../generated/palettes.json';

/**
 * The doors, and what is behind each of them.
 *
 * One entry per painting. `built` says whether the world exists yet -- a status
 * is a fact, not a grade, and a door to an unbuilt world says so rather than
 * pretending. Nothing here is invented: the palettes are sampled from the
 * files by tools/sample-palette.py, and the titles and media come from
 * src/data/artworks.ts, which is his own description of his own work.
 */

export interface DimensionEntry {
  slug: string;
  /** File in art-originals/, without the extension. */
  painting: string;
  title: { en: string; ru: string };
  /** Sampled from the painting, most-used first. */
  palette: string[];
  /** Is the world behind this door generated yet? */
  built: boolean;
}

const P = palettes as Record<string, { hex: string }[]>;
const paletteOf = (painting: string): string[] =>
  (P[painting] ?? []).map((c) => c.hex);

/**
 * Order is the order they hang in the room, and it is not arbitrary: the
 * colourful ones lead, the two graphite studies sit together, and the
 * monochromes are grouped so the room reads as a spectrum rather than a
 * shuffle. Cosmic Threads is last because it is a diagram of all the others.
 */
export const DIMENSIONS: DimensionEntry[] = [
  { slug: 'poppy', painting: 'Poppy-in-Green-Weather',
    title: { en: 'Poppy in Green Weather', ru: 'Мак в зелёную погоду' }, built: true, palette: [] },
  { slug: 'divide', painting: 'Sailing-the-Divide',
    title: { en: 'Sailing the Divide', ru: 'Под парусом по разлому' }, built: false, palette: [] },
  { slug: 'whisper', painting: 'Weight-of-a-Whisper',
    title: { en: 'Weight of a Whisper', ru: 'Вес шёпота' }, built: false, palette: [] },
  { slug: 'desert-table', painting: 'Desert-Table-Curved-Voices',
    title: { en: 'Desert Table, Curved Voices', ru: 'Пустынный стол, изогнутые голоса' }, built: false, palette: [] },
  { slug: 'tide', painting: 'Tide-Wanderer',
    title: { en: 'Tide Wanderer', ru: 'Странник прилива' }, built: false, palette: [] },
  { slug: 'pagoda', painting: 'Pagoda-in-Red-Weather',
    title: { en: 'Pagoda in Red Weather', ru: 'Пагода в красную погоду' }, built: false, palette: [] },
  { slug: 'tram', painting: 'Last-Run-of-Tram-No-5',
    title: { en: 'Last Run of Tram No. 5', ru: 'Последний рейс пятого трамвая' }, built: false, palette: [] },
  { slug: 'clockwork-fish', painting: 'Clockwork-Fish',
    title: { en: 'Clockwork Fish', ru: 'Часовая рыба' }, built: false, palette: [] },
  { slug: 'three-sails', painting: 'Three-Sails-at-Dusk',
    title: { en: 'Three Sails at Dusk', ru: 'Три паруса в сумерках' }, built: false, palette: [] },
  { slug: 'headwind', painting: 'Headwind',
    title: { en: 'Headwind', ru: 'Встречный ветер' }, built: false, palette: [] },
  { slug: 'cup-apple', painting: 'Cup-Apple-Quiet-Light',
    title: { en: 'Cup & Apple, Quiet Light', ru: 'Чашка и яблоко, тихий свет' }, built: false, palette: [] },
  { slug: 'vessel', painting: 'Vessel-with-Shadow',
    title: { en: 'Vessel with Shadow', ru: 'Сосуд с тенью' }, built: false, palette: [] },
  { slug: 'gravity', painting: 'When-Gravity-Sleeps',
    title: { en: 'When Gravity Sleeps', ru: 'Когда гравитация спит' }, built: false, palette: [] },
  { slug: 'cosmic-threads', painting: 'Cosmic-Threads',
    title: { en: 'Cosmic Threads', ru: 'Космические нити' }, built: false, palette: [] }
].map((entry) => ({ ...entry, palette: paletteOf(entry.painting) }));

export function dimensionBySlug(slug: string): DimensionEntry | undefined {
  return DIMENSIONS.find((d) => d.slug === slug);
}

/** The colour a door is lit in: the painting's most-used colour. */
export function doorColour(entry: DimensionEntry): number {
  return parseInt((entry.palette[0] ?? '#888888').slice(1), 16);
}

/** The colour of its frame: the strongest accent that is not the ground tone. */
export function frameColour(entry: DimensionEntry): number {
  return parseInt((entry.palette[2] ?? entry.palette[1] ?? '#666666').slice(1), 16);
}
