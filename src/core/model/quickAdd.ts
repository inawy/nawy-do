import { addDays, daysFromCivil } from './civil';
import { newTaskDefaults } from './view';
import type { Selection } from './selection';
import type { Repeat } from './types';

// Smart quick-add: «اشتري خبز بكرة الساعة 5 م كل أسبوع #البيت !» becomes a title plus a date, a time,
// a repeat, a star and a list. Pure and offline: Arabic (Egyptian and standard) and English words.
// Only recognised phrases are taken out of the title; anything else stays as typed.

export type QuickKind = 'due' | 'time' | 'repeat' | 'star' | 'list';

export interface QuickMatch {
  kind: QuickKind;
  /** The text that was read, as typed. */
  text: string;
}

export interface QuickAdd {
  title: string;
  due?: string;
  dueTime?: string;
  repeat?: Repeat;
  starred?: boolean;
  /** The list name written after `#` (the caller looks it up). */
  listName?: string;
  matches: QuickMatch[];
}

const DIGITS = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
/** One character in, one character out, so positions in the normalised text fit the original. */
function normalise(s: string): string {
  return [...s.toLowerCase()]
    .map((c) => {
      const i = DIGITS.indexOf(c);
      if (i >= 0) return String(i % 10);
      return c === 'أ' || c === 'إ' || c === 'آ' ? 'ا' : c === 'ة' ? 'ه' : c === 'ى' ? 'ي' : c;
    })
    .join('');
}

const B = String.raw`(?<![\p{L}\p{N}])`;
const E = String.raw`(?![\p{L}\p{N}])`;
const re = (src: string) => new RegExp(`${B}(?:${src})${E}`, 'iu');

// 0 = Sunday … 6 = Saturday.
const WEEKDAYS: [number, string][] = [
  [0, 'الاحد|sunday|sun'],
  [1, 'الاثنين|الاتنين|الاتنيين|monday|mon'],
  [2, 'الثلاثاء|الثلاثا|التلات|التلاتاء|tuesday|tue|tues'],
  [3, 'الاربعاء|الاربعا|الاربع|wednesday|wed'],
  [4, 'الخميس|thursday|thu|thur|thurs'],
  [5, 'الجمعه|الجمعة|friday|fri'],
  [6, 'السبت|saturday|sat'],
];
const DAY = String.raw`(?:يوم\s+|on\s+)?`;

const REPEATS: [Repeat, string][] = [
  ['daily', 'كل يوم|يوميا|every\\s+day|daily'],
  ['weekly', 'كل اسبوع|اسبوعيا|every\\s+week|weekly'],
  ['monthly', 'كل شهر|شهريا|every\\s+month|monthly'],
  ['yearly', 'كل سنه|كل عام|سنويا|every\\s+year|yearly|annually'],
];

const dow = (date: string): number => ((((daysFromCivil(date) ?? 0) + 4) % 7) + 7) % 7;

interface Span {
  start: number;
  end: number;
  kind: QuickKind;
}

/** Hour (1–12 or 0–23) and a day-part word or am/pm to a 24 h clock. */
function to24(h: number, part: string | undefined): number {
  if (h > 12) return h;
  const p = part ?? '';
  if (/^(ص|am|صباحا|الصبح|فجرا|الفجر)$/.test(p)) return h === 12 ? 0 : h;
  if (/^(ظهرا|الظهر)$/.test(p)) return h < 6 ? h + 12 : h;
  if (/^(م|pm|مساء|العصر|عصرا|المغرب|العشا|العشاء|ليلا|بالليل|الليل)$/.test(p)) {
    return h === 12 ? (/ليل/.test(p) ? 0 : 12) : h + 12;
  }
  // No word: 1–6 is read as the afternoon, 7–11 as the morning, 12 as noon.
  return h >= 1 && h <= 6 ? h + 12 : h;
}

export function parseQuickAdd(
  input: string,
  today: string,
  lists: readonly { id: string; name: string }[] = [],
): QuickAdd {
  const n = normalise(input);
  const spans: Span[] = [];
  const out: Omit<QuickAdd, 'title' | 'matches'> = {};
  const take = (m: RegExpExecArray | null, kind: QuickKind): m is RegExpExecArray => {
    if (!m) return false;
    const start = m.index;
    const end = m.index + m[0].length;
    if (spans.some((s) => start < s.end && end > s.start)) return false;
    spans.push({ start, end, kind });
    return true;
  };

  // Repeat first (it contains «كل يوم»), then dates, then the time.
  for (const [r, src] of REPEATS) {
    if (!out.repeat && take(re(src).exec(n), 'repeat')) out.repeat = r;
  }

  const rel: [string, number][] = [
    ['بعد\\s+بكره|بعد\\s+بكرا|بعد\\s+غد|day\\s+after\\s+tomorrow', 2],
    ['بكره|بكرا|غدا|tomorrow|tmrw', 1],
    ['النهارده|النهارده|اليوم|today', 0],
    ['(?:الاسبوع|اسبوع)\\s+(?:الجاي|القادم|الجايه|القادمه)|next\\s+week', 7],
  ];
  for (const [src, days] of rel) {
    if (out.due === undefined && take(re(src).exec(n), 'due')) out.due = addDays(today, days);
  }
  const after = re(
    String.raw`(?:بعد|in)\s+(\d{1,3})\s+(يوم|ايام|اسبوع|اسابيع|شهر|days?|weeks?|months?)`,
  );
  if (out.due === undefined) {
    const m = after.exec(n);
    if (m && take(m, 'due')) {
      const k = Number(m[1]);
      const unit = m[2] ?? '';
      out.due = addDays(
        today,
        /^(اسبوع|اسابيع|week)/.test(unit) ? k * 7 : /^(شهر|month)/.test(unit) ? k * 30 : k,
      );
    }
  }
  if (out.due === undefined) {
    for (const [d, src] of WEEKDAYS) {
      if (out.due === undefined && take(re(DAY + '(?:' + src + ')').exec(n), 'due')) {
        out.due = addDays(today, ((d - dow(today) + 6) % 7) + 1); // the next one, never today
      }
    }
  }

  const part = String.raw`(?:\s*(ص|م|am|pm|صباحا|الصبح|فجرا|الفجر|ظهرا|الظهر|مساء|العصر|عصرا|المغرب|العشا|العشاء|ليلا|بالليل|الليل))?`;
  const clock = String.raw`(\d{1,2})(?::(\d{2}))?`;
  const worded =
    re(String.raw`(?:الساعه|الساعة|at|@)\s*${clock}${part}`).exec(n) ??
    re(String.raw`${clock}\s*(ص|م|am|pm|صباحا|مساء|بالليل|العصر|الظهر)`).exec(n);
  const plain = worded ? null : re(String.raw`([01]?\d|2[0-3]):([0-5]\d)`).exec(n);
  const tm = worded ?? plain;
  if (tm && take(tm, 'time')) {
    const hour = plain ? Number(tm[1]) : to24(Number(tm[1]), tm[3]); // «17:30» is already 24 h
    if (hour <= 23 && Number(tm[2] ?? 0) <= 59) {
      out.dueTime = `${String(hour).padStart(2, '0')}:${tm[2] ?? '00'}`;
    } else spans.pop();
  }

  const star = /(?<=^|\s)!(?=$|\s)/u.exec(n);
  if (take(star, 'star')) out.starred = true;
  const hash = /(?<=^|\s)#([^\s#]+)/u.exec(input);
  const wanted = (hash?.[1] ?? '').replace(/_/g, ' ');
  // «#word» is only read when such a list exists; otherwise it stays in the title as typed.
  if (findListByName(lists, wanted) && take(hash, 'list')) out.listName = wanted;

  if (out.repeat && out.due === undefined) out.due = today;
  if (out.dueTime && out.due === undefined) out.due = today;

  const sorted = [...spans].sort((a, b) => a.start - b.start);
  let title = '';
  let at = 0;
  for (const s of sorted) {
    title += input.slice(at, s.start) + ' ';
    at = s.end;
  }
  title = (title + input.slice(at))
    .replace(/\s+/g, ' ')
    .replace(/^(?:في|ب|على|at|on|by|for)\s+|\s+(?:في|ب|على|at|on|by|for|ال)$/giu, '')
    .trim();

  // Nothing left to call the task: keep what was typed and read nothing.
  if (title === '') return { title: input.trim(), matches: [] };
  const matches = sorted.map((s) => ({ kind: s.kind, text: input.slice(s.start, s.end) }));
  return { title, ...out, matches };
}

const sameName = (a: string, b: string) =>
  normalise(a).replace(/\s+/g, ' ').trim() === normalise(b).replace(/\s+/g, ' ').trim();

/** The list a `#name` points at (first by order), or undefined when there is no such list. */
export function findListByName<L extends { id: string; name: string }>(
  lists: readonly L[],
  name: string | undefined,
): L | undefined {
  return name === undefined ? undefined : lists.find((l) => sameName(l.name, name));
}

/** What to save for text typed in the add sheet: a title and the options of the new task. */
export function quickTask(
  text: string,
  literal: boolean,
  selection: Selection,
  lists: readonly { id: string; name: string }[],
  today: string,
): {
  title: string;
  options: {
    listId?: string;
    starred?: boolean;
    due?: string;
    dueTime?: string;
    repeat?: Repeat;
  };
} {
  const options: ReturnType<typeof quickTask>['options'] = newTaskDefaults(selection, today);
  if (literal) return { title: text.trim(), options };
  const r = parseQuickAdd(text, today, lists);
  const list = findListByName(lists, r.listName);
  if (list) options.listId = list.id;
  if (r.starred) options.starred = true;
  if (r.due) options.due = r.due;
  if (r.dueTime) options.dueTime = r.dueTime;
  if (r.repeat) options.repeat = r.repeat;
  return { title: r.title, options };
}
