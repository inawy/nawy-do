import { addDays, daysFromCivil, monthLength, parseCivil } from './civil';
import type { Repeat, Task } from './types';

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

/** `date` plus `n` months; a day that does not exist in the target month becomes its last day. */
export function addMonths(date: string, n: number): string {
  const c = parseCivil(date);
  if (!c) return date;
  const total = Math.min(9999 * 12 + 11, Math.max(0, c.y * 12 + (c.m - 1) + n));
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  const d = Math.min(c.d, monthLength(y, m));
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

/**
 * The next occurrence of a repeating task: the first one after both its current due date and
 * `today`, so a task missed for a week does not come back as seven overdue copies. Completing
 * early moves it one step ahead of its due date. (Monthly: a 31st becomes the 28th after
 * February and stays there: the anchor day is not remembered.)
 */
export function nextDue(due: string, repeat: Repeat, today: string): string {
  const a = daysFromCivil(due);
  const t = daysFromCivil(today);
  const c = parseCivil(due);
  const tc = parseCivil(today);
  if (a === undefined || t === undefined || !c || !tc) return due;
  if (repeat === 'monthly') {
    const k = Math.max(1, tc.y * 12 + tc.m - (c.y * 12 + c.m));
    const next = addMonths(due, k);
    return next > today ? next : addMonths(due, k + 1);
  }
  if (repeat === 'yearly') {
    const k = Math.max(1, tc.y - c.y);
    const next = addMonths(due, 12 * k);
    return next > today ? next : addMonths(due, 12 * (k + 1));
  }
  if (repeat === 'workdays') {
    // 1970-01-01 was a Thursday; Friday (5) and Saturday (6) are the weekend.
    let day = Math.max(a, t) + 1;
    while ((day + 4) % 7 >= 5) day += 1;
    return addDays(due, day - a);
  }
  const step = repeat === 'daily' ? 1 : 7;
  const k = Math.max(1, Math.floor((t - a) / step) + 1);
  return addDays(due, k * step);
}

/** Does completing this task bring it back instead of finishing it? */
export const isRepeating = (task: Task): task is Task & { due: string; repeat: Repeat } =>
  task.status === 'open' && task.repeat !== undefined && task.due !== undefined;

/** How a repetition is shown to the user. */
export const REPEAT_LABEL: Record<Repeat, string> = {
  daily: 'كل يوم',
  workdays: 'أيام العمل (الأحد–الخميس)',
  weekly: 'كل أسبوع',
  monthly: 'كل شهر',
  yearly: 'كل سنة',
};
