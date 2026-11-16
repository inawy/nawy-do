// The single place that reads the system clock (D-005). Everything else receives `now`.
export const systemClock = (): number => Date.now();

/** Today's civil date in the device's local time zone, `YYYY-MM-DD`. */
export function systemToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** A readable local date and time for a stored timestamp (this file is the only one that reads `Date`). */
export const formatWhen = (ms: number, lang = 'ar'): string =>
  new Date(ms).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' });

/** Milliseconds from `now` to the next local midnight (+1 s so the new day has surely begun). */
export function msUntilLocalMidnight(now: number): number {
  const d = new Date(now);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  return next - now + 1000;
}

/** A timestamp as UTC `YYYYMMDDTHHMMSSZ` (iCalendar's DTSTAMP). */
export const utcStamp = (ms: number): string =>
  new Date(ms).toISOString().replace(/[-:]|\.\d+/g, '');

/** A civil date (`YYYY-MM-DD`) and time (`HH:MM`) in the device's time zone, as a timestamp. */
export function localTimeMs(date: string, time: string): number {
  const [y = 0, mo = 1, d = 1] = date.split('-').map(Number);
  const [h = 0, mi = 0] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi).getTime();
}
