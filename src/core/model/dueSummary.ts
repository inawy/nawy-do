import type { Task } from './types';

export interface DueSummary {
  /** Open tasks whose date has passed. */
  overdue: number;
  /** Open tasks due today. */
  today: number;
}

/** What needs attention at a glance; deleted and finished tasks do not count. Pure. */
export function dueSummary(tasks: readonly Task[], today: string): DueSummary {
  const summary: DueSummary = { overdue: 0, today: 0 };
  for (const t of tasks) {
    if (t.status !== 'open' || t.deletedAt !== undefined || t.due === undefined) continue;
    if (t.due < today) summary.overdue++;
    else if (t.due === today) summary.today++;
  }
  return summary;
}
