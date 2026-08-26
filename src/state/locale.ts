import { useEffect, useState } from 'react';

/**
 * Which language the site is in.
 *
 * Russian and English are both authored, not translated-from-English: his
 * school, his teachers and his family read Russian, and his own words will
 * arrive in it. Neither is the "real" one with the other bolted on.
 *
 * This is the foundation for the locale routing in the plan -- per-locale URLs
 * with a full hreflang cluster, which needs a prerender step. Until that lands
 * the choice lives here and in localStorage, which is enough to build the
 * content against and cheap to swap out.
 */

export type Locale = 'en' | 'ru';

const STORAGE_KEY = 'ag.locale';

function initial(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage?.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'ru') return saved;
  // Their browser's preference, not their IP's. Where someone is has never
  // been a reliable guide to what they read.
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

let current: Locale = initial();
const listeners = new Set<(l: Locale) => void>();

export function getLocale(): Locale {
  return current;
}

export function setLocale(next: Locale): void {
  current = next;
  try {
    window.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    // Private browsing. The choice still holds for this visit.
  }
  document.documentElement.lang = next;
  for (const listener of listeners) listener(next);
}

export function useLocale(): [Locale, (next: Locale) => void] {
  const [locale, set] = useState(current);
  useEffect(() => {
    listeners.add(set);
    set(current);
    document.documentElement.lang = current;
    return () => { listeners.delete(set); };
  }, []);
  return [locale, setLocale];
}

/** Pick the right side of any {en, ru} pair. */
export function pick<T>(pair: { en: T; ru: T }, locale: Locale): T {
  return pair[locale];
}
