// Civil dates (`YYYY-MM-DD`, no time zone) with integer arithmetic only: no Date, no Intl (D-005).

const SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const monthLength = (y: number, m: number): number =>
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
