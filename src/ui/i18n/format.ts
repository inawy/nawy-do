import { dayDiff, isCivilTime, parseCivil } from '@/core/model';
import type { I18n } from './index';

/** `21:30` → «9:30 م» / "9:30 PM". Anything that is not a time is returned as it is. */
export function formatTime(time: string, { t }: Pick<I18n, 't'>): string {
  if (!isCivilTime(time)) return time;
  const h = Number(time.slice(0, 2));
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${time.slice(3)} ${t(h < 12 ? 'time.am' : 'time.pm')}`;
}

/** «النهارده» / «بكرة» / «امبارح» near today, otherwise «27 أكتوبر» (+ the year if it differs). */
export function formatDue(
  due: string,
  today: string,
  { t, lang }: Pick<I18n, 't' | 'lang'>,
): string {
  const diff = dayDiff(due, today);
  const c = parseCivil(due);
  if (diff === undefined || !c) return due;
  if (diff === 0) return t('date.today');
  if (diff === 1) return t('date.tomorrow');
  if (diff === -1) return t('date.yesterday');
  const month = t(`month.${c.m}` as 'month.1');
  const year = parseCivil(today)?.y === c.y ? '' : ` ${c.y}`;
  return lang === 'en' ? `${month} ${c.d}${year ? `, ${c.y}` : ''}` : `${c.d} ${month}${year}`;
}
