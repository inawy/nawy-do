import { groupTasks, type TaskGroups } from './group';
import { listOf } from './lists';
import type { Task, TaskList } from './types';

/** The built-in views. `main` is the implicit main list («نواياي»). */
export type ViewId = 'main' | 'starred' | 'scheduled';
/** What the screen is showing: a built-in view or one list. */
export type Selection = ViewId | `list:${string}`;

export const listSelection = (id: string): Selection => `list:${id}`;
export const selectedListId = (s: Selection): string | undefined =>
  s.startsWith('list:') ? s.slice('list:'.length) : undefined;

/** The tasks a selection shows (before grouping into open/done or by date). */
export function tasksIn(tasks: readonly Task[], lists: readonly TaskList[], s: Selection): Task[] {
  if (s === 'starred') return tasks.filter((t) => t.starred);
  if (s === 'scheduled') return [...tasks];
  const wanted = selectedListId(s); // undefined = main
  return tasks.filter((t) => listOf(t, lists) === wanted);
}

export const groupIn = (
  tasks: readonly Task[],
  lists: readonly TaskList[],
  s: Selection,
): TaskGroups => groupTasks(tasksIn(tasks, lists, s));

export interface Counts {
  main: number;
  starred: number;
  scheduled: number;
  /** Open tasks per live list id. */
  lists: Record<string, number>;
}

/** Open-task counts for the navigation. */
export function countsFor(tasks: readonly Task[], lists: readonly TaskList[]): Counts {
  const open = tasks.filter((t) => t.status === 'open' && t.deletedAt === undefined);
  const counts: Counts = {
    main: 0,
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
