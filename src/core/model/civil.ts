// Civil dates (`YYYY-MM-DD`, no time zone) with integer arithmetic only: no Date, no Intl (D-005).

const SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const monthLength = (y: number, m: number): number =>
  m === 2 ? (isLeap(y) ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31;

export function parseCivil(s: string): { y: number; m: number; d: number } | undefined {
  const match = SHAPE.exec(s);
  if (!match) return undefined;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > monthLength(y, m)) return undefined;
  return { y, m, d };
}

const TIME_SHAPE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** A time of day, `HH:MM`, 24 h. */
export const isCivilTime = (s: string): boolean => TIME_SHAPE.test(s);

/** `21:30` → «9:30 م». Anything that is not a time is returned as it is. */
export function formatTime(time: string): string {
  if (!isCivilTime(time)) return time;
  const h = Number(time.slice(0, 2));
  const minutes = time.slice(3);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${minutes} ${h < 12 ? 'ص' : 'م'}`;
}

export const isCivilDate = (s: string): boolean => parseCivil(s) !== undefined;

/** Days since 1970-01-01 (Hinnant's algorithm). */
export function daysFromCivil(s: string): number | undefined {
  const c = parseCivil(s);
  if (!c) return undefined;
  const y = c.m <= 2 ? c.y - 1 : c.y;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (c.m + (c.m > 2 ? -3 : 9)) + 2) / 5) + c.d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export type DueState = 'overdue' | 'today' | 'upcoming';

export function dueState(due: string, today: string): DueState {
  if (due < today) return 'overdue';
  return due === today ? 'today' : 'upcoming';
}

const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/** «النهارده» / «بكرة» / «امبارح» near today, otherwise «27 أكتوبر» (+ the year if it differs). */
export function formatDue(due: string, today: string): string {
  const a = daysFromCivil(due);
  const b = daysFromCivil(today);
  const c = parseCivil(due);
  if (a === undefined || b === undefined || !c) return due;
  const diff = a - b;
  if (diff === 0) return 'النهارده';
  if (diff === 1) return 'بكرة';
  if (diff === -1) return 'امبارح';
  const month = MONTHS[c.m - 1] ?? '';
  const sameYear = parseCivil(today)?.y === c.y;
  return sameYear ? `${c.d} ${month}` : `${c.d} ${month} ${c.y}`;
}

/** Inverse of `daysFromCivil` (Hinnant's algorithm). */
function civilFromDays(z0: number): string {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** `date` plus `n` days (negative allowed); returns `date` unchanged if it is not a valid civil date. */
export function addDays(date: string, n: number): string {
  const base = daysFromCivil(date);
  if (base === undefined) return date;
  // Stays inside years 0000–9999: a fifth digit would be a date its own import rejects.
  const lo = daysFromCivil('0000-01-01') ?? 0;
  const hi = daysFromCivil('9999-12-31') ?? 0;
  return civilFromDays(Math.min(hi, Math.max(lo, base + n)));
}

export interface QuickDue {
  label: string;
  value: string;
}

/** The one-tap choices of the due-date picker. */
export function quickDueOptions(today: string): QuickDue[] {
  return [
    { label: 'النهارده', value: today },
    { label: 'بكرة', value: addDays(today, 1) },
    { label: 'الأسبوع الجاي', value: addDays(today, 7) },
  ];
}
