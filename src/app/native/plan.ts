import type { Task } from '@/core/model';
import { localTimeMs } from '../clock';

const DAY_MS = 24 * 60 * 60 * 1000;
/** How far ahead the phone is given alarms, and the most it is given (Android keeps a few hundred). */
const WINDOW_DAYS = 14;
const LIMIT = 60;

export interface PlannedAlert {
  /** A positive 31-bit number: what Android needs as a notification id. */
  readonly id: number;
  readonly taskId: string;
  readonly atMs: number;
  readonly title: string;
}

/** A stable id from the task and when it rings, so re-planning replaces rather than duplicates. */
export function alertId(taskId: string, atMs: number): number {
  let h = 17;
  for (const c of `${taskId}|${atMs}`) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return h & 0x7fffffff || 1;
}

/** Open tasks with a set time whose alert falls within the next 14 days, soonest first. */
export function planAlerts(tasks: readonly Task[], nowMs: number): PlannedAlert[] {
  const out: PlannedAlert[] = [];
  for (const task of tasks) {
    if (task.status === 'done' || !task.due || !task.dueTime) continue;
    const atMs = localTimeMs(task.due, task.dueTime) - (task.remindBefore ?? 0) * 60_000;
    if (atMs <= nowMs || atMs > nowMs + WINDOW_DAYS * DAY_MS) continue;
    out.push({ id: alertId(task.id, atMs), taskId: task.id, atMs, title: task.title });
  }
  return out.sort((a, b) => a.atMs - b.atMs).slice(0, LIMIT);
}
