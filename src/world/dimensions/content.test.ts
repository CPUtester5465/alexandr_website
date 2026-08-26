import { describe, it, expect } from 'vitest';
import { DIMENSIONS } from './registry';
import { SUBJECTS } from './subjects';

/**
 * Law 9: both languages or neither. A door whose Russian is missing is a door
 * a Russian reader cannot use, and it fails silently in English.
 */

const CYRILLIC = /[А-Яа-яЁё]/;

describe('every door speaks both languages', () => {
  it('has a title in each', () => {
    for (const entry of DIMENSIONS) {
      expect(entry.title.en.trim(), `${entry.slug} en`).not.toBe('');
      expect(entry.title.ru.trim(), `${entry.slug} ru`).not.toBe('');
    }
  });

  it('has Russian that is actually Russian, not English copied across', () => {
    // The failure this catches: filling the ru slot with the en string to make
    // a type check pass. It looks complete and reads as broken.
    for (const entry of DIMENSIONS) {
      expect(CYRILLIC.test(entry.title.ru), `${entry.slug} ru is not Cyrillic`).toBe(true);
      expect(entry.title.ru, `${entry.slug} ru duplicates en`).not.toBe(entry.title.en);
    }
  });
});

describe('the record', () => {
  it('states every result in both languages', () => {
    for (const subject of SUBJECTS) {
      expect(subject.records.length, `${subject.slug} has no record`).toBeGreaterThan(0);
      for (const record of subject.records) {
        expect(CYRILLIC.test(record.result.ru)).toBe(true);
        expect(CYRILLIC.test(record.competition.ru)).toBe(true);
        if (record.note) expect(CYRILLIC.test(record.note.ru)).toBe(true);
      }
    }
  });

  it('never softens a standing into something it was not', () => {
    // Law 1. A prize is a prize and a win is a win; the words must agree with
    // the standing so nobody can quietly promote one later.
    for (const subject of SUBJECTS) {
      for (const record of subject.records) {
        if (record.standing === 'winner') {
          expect(record.result.en).toBe('Winner');
          expect(record.result.ru).toBe('Победитель');
        } else {
          expect(record.result.en).toBe('Prize-winner');
          expect(record.result.ru).toBe('Призёр');
        }
      }
    }
  });

  it('covers all four subjects he actually wins in', () => {
    expect(SUBJECTS.map((s) => s.slug).sort())
      .toEqual(['chemistry', 'economics', 'invention', 'mathematics']);
  });
});
