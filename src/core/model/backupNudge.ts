const DAY_MS = 86_400_000;
/** A local-only app has no second copy: ask for one after this long without a backup. */
export const NUDGE_AFTER_DAYS = 14;
/** Not worth asking before there is something to lose. */
export const NUDGE_MIN_TASKS = 5;

/** Should the app suggest taking a backup file now? Pure: time comes in as a parameter. */
export function needsBackupNudge(
  lastExportAt: number | undefined,
  now: number,
  taskCount: number,
): boolean {
  if (taskCount < NUDGE_MIN_TASKS) return false;
  return lastExportAt === undefined || now - lastExportAt > NUDGE_AFTER_DAYS * DAY_MS;
}
