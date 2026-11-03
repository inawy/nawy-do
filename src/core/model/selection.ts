import { groupTasks, type TaskGroups } from './group';
import { listOf } from './lists';
import type { Task, TaskList } from './types';

/** The built-in views. `main` is the implicit main list («نواياي»). */
export type ViewId = 'main' | 'today' | 'starred' | 'scheduled';
/** What the screen is showing: a built-in view or one list. */
export type Selection = ViewId | `list:${string}`;

export const listSelection = (id: string): Selection => `list:${id}`;
export const selectedListId = (s: Selection | 'search'): string | undefined =>
  s.startsWith('list:') ? s.slice('list:'.length) : undefined;

/**
 * «اليوم»: open tasks due today or overdue, and what was due today and is already done (so the
 * day's progress stays visible; older done tasks do not clutter it).
 */
const isForToday = (today: string) => (t: Task) =>
  t.due !== undefined && (t.status === 'open' ? t.due <= today : t.due === today);

/** The tasks a selection shows (before grouping into open/done or by date). */
export function tasksIn(
  tasks: readonly Task[],
  lists: readonly TaskList[],
  s: Selection,
  today: string,
): Task[] {
  if (s === 'today') return tasks.filter(isForToday(today));
  if (s === 'starred') return tasks.filter((t) => t.starred);
  if (s === 'scheduled') return [...tasks];
  const wanted = selectedListId(s); // undefined = main
  return tasks.filter((t) => listOf(t, lists) === wanted);
}

export const groupIn = (
  tasks: readonly Task[],
  lists: readonly TaskList[],
  s: Selection,
  today: string,
): TaskGroups => groupTasks(tasksIn(tasks, lists, s, today));

export interface Counts {
  main: number;
  today: number;
  starred: number;
  scheduled: number;
  /** Open tasks per live list id. */
  lists: Record<string, number>;
}

/** Open-task counts for the navigation. */
export function countsFor(
  tasks: readonly Task[],
  lists: readonly TaskList[],
  today: string,
): Counts {
  const open = tasks.filter((t) => t.status === 'open' && t.deletedAt === undefined);
  const counts: Counts = {
    main: 0,
    today: open.filter((t) => t.due !== undefined && t.due <= today).length,
    starred: open.filter((t) => t.starred).length,
    scheduled: open.filter((t) => t.due !== undefined).length,
    lists: {},
  };
  for (const t of open) {
    const id = listOf(t, lists);
    if (id === undefined) counts.main++;
    else counts.lists[id] = (counts.lists[id] ?? 0) + 1;
  }
  return counts;
}
