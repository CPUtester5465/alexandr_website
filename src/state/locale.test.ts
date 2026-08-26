import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pick, setLocale, getLocale } from './locale';

describe('pick', () => {
  it('returns the side asked for', () => {
    const title = { en: 'Poppy in Green Weather', ru: 'Мак в зелёную погоду' };
    expect(pick(title, 'en')).toBe('Poppy in Green Weather');
    expect(pick(title, 'ru')).toBe('Мак в зелёную погоду');
  });
});

describe('setLocale', () => {
  beforeEach(() => setLocale('en'));

  it('sets the document language, which screen readers and Google both read', () => {
    setLocale('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(getLocale()).toBe('ru');
  });

  it('survives storage being unavailable', () => {
    // Private browsing throws on setItem. The choice must still hold for the
    // visit rather than taking the page down.
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => { throw new Error('denied'); };
    expect(() => setLocale('ru')).not.toThrow();
    expect(getLocale()).toBe('ru');
    window.localStorage.setItem = original;
  });
});
