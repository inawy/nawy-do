import type { Task } from './types';

export interface TaskGroups {
  open: Task[];
  done: Task[];
}

/** Open tasks newest first (a new intention lands on top); done tasks by completion, newest first. */
export function groupTasks(tasks: readonly Task[]): TaskGroups {
  const open = tasks
    .filter((t) => t.status === 'open' && t.deletedAt === undefined)
    .sort((a, b) => b.sortOrder - a.sortOrder || a.id.localeCompare(b.id));
  const done = tasks
    .filter((t) => t.status === 'done' && t.deletedAt === undefined)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0) || a.id.localeCompare(b.id));
  return { open, done };
}

export interface ScheduledGroups {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
}

/** Open tasks that have a due date, split by how they relate to `today` and sorted by date. */
export function groupScheduled(tasks: readonly Task[], today: string): ScheduledGroups {
  const dated = tasks
    .filter((t) => t.status === 'open' && t.deletedAt === undefined && t.due !== undefined)
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? '') || a.sortOrder - b.sortOrder);
  return {
    overdue: dated.filter((t) => (t.due ?? '') < today),
    today: dated.filter((t) => t.due === today),
    upcoming: dated.filter((t) => (t.due ?? '') > today),
  };
}

export type ViewId = 'all' | 'starred' | 'scheduled';

/** Open-task counts shown on the navigation. */
export function viewCounts(tasks: readonly Task[]): Record<ViewId, number> {
  const open = tasks.filter((t) => t.status === 'open' && t.deletedAt === undefined);
  return {
    all: open.length,
    starred: open.filter((t) => t.starred).length,
    scheduled: open.filter((t) => t.due !== undefined).length,
  };
}
