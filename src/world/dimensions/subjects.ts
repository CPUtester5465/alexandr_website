/**
 * The four subjects he actually wins in, as worlds.
 *
 * This replaces the desk. A display case is the wrong shape for a boy who does
 * things: it puts his mind behind glass beside his paintings instead of in the
 * same room as them. Four more doors puts them in the same register -- you walk
 * into a result the way you walk into a painting.
 *
 * Every fact below is verified from the school's public record, not supplied by
 * anybody's memory. Law 1: nothing on this site is invented. A slot with no
 * fact in it stays empty.
 *
 * THE PALETTES. The paintings supply theirs by sampling; these have no file to
 * sample from, so they are built from the study's own tokens -- paper, plaster,
 * stone, graphite, ink -- plus exactly one colour each. That is the point
 * rather than a shortcut: they read as his study extended, not as four worlds
 * impersonating paintings, and the rationed colour is what the subject is made
 * of.
 */

export interface SubjectRecord {
  /** What he won, in both languages. Verbatim from the record. */
  result: { en: string; ru: string };
  /** Where it was won. */
  competition: { en: string; ru: string };
  /** 'winner' or 'prize'. Never softened, never inflated. */
  standing: 'winner' | 'prize';
  year: number;
  /** Anything that makes the result more than its title. */
  note?: { en: string; ru: string };
}

export interface SubjectEntry {
  slug: string;
  title: { en: string; ru: string };
  /** Paper, plaster, stone, graphite, ink, then the one colour. */
  palette: string[];
  records: SubjectRecord[];
}

/** The study's own materials. Shared by all four, so the room extends into them. */
const STUDY = ['#EDE6D2', '#C8B392', '#8A8578', '#4A4741', '#23241F'];

export const SUBJECTS: SubjectEntry[] = [
  {
    slug: 'mathematics',
    title: { en: 'Mathematics', ru: 'Математика' },
    // Instrument red. The rationed colour of a measured, true value.
    palette: [...STUDY, '#B3402C'],
    records: [
      {
        result: { en: 'Winner', ru: 'Победитель' },
        competition: {
          en: 'Oblast Olympiad in Mathematics, regional stage',
          ru: 'Областная олимпиада по математике, региональный этап'
        },
        standing: 'winner',
        year: 2026
      },
      {
        result: { en: 'Prize-winner', ru: 'Призёр' },
        competition: {
          en: 'Regional olympiad, Year 4',
          ru: 'Региональная олимпиада, 4 класс'
        },
        standing: 'prize',
        year: 2025
      }
    ]
  },
  {
    slug: 'invention',
    title: { en: 'Invention', ru: 'Изобретательство' },
    // Brass. Machinery, and the only warm metal in the site.
    palette: [...STUDY, '#AC7036'],
    records: [
      {
        result: { en: 'Winner', ru: 'Победитель' },
        competition: {
          en: '«День Кулибина» — young inventors and technicians, at SWSU',
          ru: '«День Кулибина» — конкурс юных изобретателей и техников, ЮЗГУ'
        },
        standing: 'winner',
        year: 2026,
        note: {
          en: 'Judged by university faculty against entrants from across the oblast',
          ru: 'Жюри — преподаватели университета; участники со всей области'
        }
      }
    ]
  },
  {
    slug: 'chemistry',
    title: { en: 'Chemistry', ru: 'Химия' },
    // Reagent green. Nothing else in the site is this colour.
    palette: [...STUDY, '#3E7C74'],
    records: [
      {
        result: { en: 'Prize-winner', ru: 'Призёр' },
        competition: {
          en: '«Эстафета знаний – 2026», natural sciences',
          ru: '«Эстафета знаний – 2026», естественно-научное направление'
        },
        standing: 'prize',
        year: 2026
      }
    ]
  },
  {
    slug: 'economics',
    title: { en: 'Economics', ru: 'Экономика' },
    // Ledger indigo.
    palette: [...STUDY, '#3A4A6B'],
    records: [
      {
        result: { en: 'Prize-winner', ru: 'Призёр' },
        competition: {
          en: 'All-Russian Olympiad in Economics, municipal stage',
          ru: 'Всероссийская олимпиада школьников по экономике, муниципальный этап'
        },
        standing: 'prize',
        year: 2026,
        note: {
          en: 'Sat the Year 7 paper while in Year 5',
          ru: 'Писал олимпиаду за 7 класс, обучаясь в 5 классе'
        }
      }
    ]
  }
];

export function subjectBySlug(slug: string): SubjectEntry | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}
