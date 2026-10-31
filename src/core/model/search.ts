import type { Task } from './types';

/**
 * Folds text so Arabic spellings match each other: diacritics and tatweel dropped, the alef forms
 * (أ إ آ ٱ) become ا, ى becomes ي, ة becomes ه, and Latin is lower-cased. Pure.
 */
export function foldText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();
}

/**
 * Live tasks whose title, notes or step titles contain EVERY word of `query` (folded). An empty
 * query matches nothing: the caller shows the normal view instead. Order is kept.
 */
export function searchTasks(tasks: readonly Task[], query: string): Task[] {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return tasks.filter((t) => {
    if (t.deletedAt !== undefined) return false;
    const hay = foldText(
      [t.title, t.notes ?? '', ...(t.steps ?? []).map((s) => s.title)].join('\n'),
    );
    return words.every((w) => hay.includes(w));
  });
}
