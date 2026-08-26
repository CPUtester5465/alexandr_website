import palettes from '../generated/palettes.json';
import { SUBJECTS } from './subjects';

/**
 * The doors, and what is behind each of them.
 *
 * One entry per painting. `built` says whether the world exists yet -- a status
 * is a fact, not a grade, and a door to an unbuilt world says so rather than
 * pretending. Nothing here is invented: the palettes are sampled from the
 * files by tools/sample-palette.py, and the titles and media come from
 * src/data/artworks.ts, which is his own description of his own work.
 */

export type DoorKind = 'painting' | 'subject';

export interface DimensionEntry {
  slug: string;
  /**
   * What sort of door this is.
   *
   * Fourteen paintings and four subjects, in one room, treated as the same kind
   * of thing -- because they are. He measures the world and he paints its
   * weather, and the site should not put one behind glass and the other on a
   * wall.
   */
  kind: DoorKind;
  /** File in art-originals/, without the extension. Empty for a subject. */
  painting: string;
  title: { en: string; ru: string };
  /** Sampled from the painting, most-used first. */
  palette: string[];
  /**
   * Is the world behind this door generated yet?
   *
   * All fourteen are, since every dimension is a recipe over the same chunked
   * generator. Kept as a field rather than deleted: the next painting he makes
   * gets a door before it gets a world, and it must be able to say so.
   */
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
    title: { en: 'Sailing the Divide', ru: 'Под парусом по разлому' }, built: true, palette: [] },
  { slug: 'whisper', painting: 'Weight-of-a-Whisper',
    title: { en: 'Weight of a Whisper', ru: 'Вес шёпота' }, built: true, palette: [] },
  { slug: 'desert-table', painting: 'Desert-Table-Curved-Voices',
    title: { en: 'Desert Table, Curved Voices', ru: 'Пустынный стол, изогнутые голоса' }, built: true, palette: [] },
  { slug: 'tide', painting: 'Tide-Wanderer',
    title: { en: 'Tide Wanderer', ru: 'Странник прилива' }, built: true, palette: [] },
  { slug: 'pagoda', painting: 'Pagoda-in-Red-Weather',
    title: { en: 'Pagoda in Red Weather', ru: 'Пагода в красную погоду' }, built: true, palette: [] },
  { slug: 'tram', painting: 'Last-Run-of-Tram-No-5',
    title: { en: 'Last Run of Tram No. 5', ru: 'Последний рейс пятого трамвая' }, built: true, palette: [] },
  { slug: 'clockwork-fish', painting: 'Clockwork-Fish',
    title: { en: 'Clockwork Fish', ru: 'Часовая рыба' }, built: true, palette: [] },
  { slug: 'three-sails', painting: 'Three-Sails-at-Dusk',
    title: { en: 'Three Sails at Dusk', ru: 'Три паруса в сумерках' }, built: true, palette: [] },
  { slug: 'headwind', painting: 'Headwind',
    title: { en: 'Headwind', ru: 'Встречный ветер' }, built: true, palette: [] },
  { slug: 'cup-apple', painting: 'Cup-Apple-Quiet-Light',
    title: { en: 'Cup & Apple, Quiet Light', ru: 'Чашка и яблоко, тихий свет' }, built: true, palette: [] },
  { slug: 'vessel', painting: 'Vessel-with-Shadow',
    title: { en: 'Vessel with Shadow', ru: 'Сосуд с тенью' }, built: true, palette: [] },
  { slug: 'gravity', painting: 'When-Gravity-Sleeps',
    title: { en: 'When Gravity Sleeps', ru: 'Когда гравитация спит' }, built: true, palette: [] },
  { slug: 'cosmic-threads', painting: 'Cosmic-Threads',
    title: { en: 'Cosmic Threads', ru: 'Космические нити' }, built: true, palette: [] }
].map((entry) => ({ ...entry, kind: 'painting' as DoorKind, palette: paletteOf(entry.painting) }))
  .concat(
    // The subjects sit after the paintings so the room reads as work, then
    // mind. Their palettes are the study's own materials plus one colour each.
    SUBJECTS.map((subject) => ({
      slug: subject.slug,
      kind: 'subject' as DoorKind,
      painting: '',
      title: subject.title,
      built: true,
      palette: subject.palette
    }))
  );

export function dimensionBySlug(slug: string): DimensionEntry | undefined {
  return DIMENSIONS.find((d) => d.slug === slug);
}

/**
 * The colour a door is lit in.
 *
 * A painting's is its most-used colour, so the room becomes a chart of his
 * palettes. A subject's is its one rationed colour, which is the last entry --
 * lighting a subject door in paper-cream would make four identical doors and
 * lose the whole point of rationing.
 */
export function doorColour(entry: DimensionEntry): number {
  const hex = entry.kind === 'subject'
    ? entry.palette[entry.palette.length - 1]
    : entry.palette[0];
  return parseInt((hex ?? '#888888').slice(1), 16);
}

/** The colour of its frame: for a subject, the study's own wood. */
export function frameColour(entry: DimensionEntry): number {
  if (entry.kind === 'subject') return 0x8A5A33;
  return parseInt((entry.palette[2] ?? entry.palette[1] ?? '#666666').slice(1), 16);
}
