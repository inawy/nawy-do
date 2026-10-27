// The single place that reads the system clock (D-005). Everything else receives `now`.
export const systemClock = (): number => Date.now();

/** Today's civil date in the device's local time zone, `YYYY-MM-DD`. */
export function systemToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
