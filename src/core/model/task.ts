import type { Task } from './types';

/**
 * The next `updatedAt`: the current time, but strictly greater than the previous value, so two
 * writes in one millisecond (or a clock that stepped back) still order correctly. `updatedAt`
 * is the clock that decides merges.
 */
export function nextUpdatedAt(previous: number, now: number): number {
  return Math.max(now, previous + 1);
}

export function createTask(id: string, title: string, now: number, sortOrder = now): Task {
  return {
    id,
    title: title.trim(),
    status: 'open',
    starred: false,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'notes' | 'starred' | 'due' | 'sortOrder'>>;

export function updateTask(task: Task, patch: TaskPatch, now: number): Task {
  const next: Task = { ...task, ...patch, updatedAt: nextUpdatedAt(task.updatedAt, now) };
  if (patch.title !== undefined) next.title = patch.title.trim();
  return next;
}

export function completeTask(task: Task, now: number): Task {
  if (task.status === 'done') return task;
  const t = nextUpdatedAt(task.updatedAt, now);
  return { ...task, status: 'done', doneAt: t, updatedAt: t };
}

export function reopenTask(task: Task, now: number): Task {
  if (task.status === 'open') return task;
  const next: Task = { ...task, status: 'open', updatedAt: nextUpdatedAt(task.updatedAt, now) };
  delete next.doneAt;
  return next;
}

/** Deleting never removes a record; it replaces it with a tombstone that keeps no content. */
export function tombstoneTask(task: Task, now: number): Task {
  const t = nextUpdatedAt(task.updatedAt, now);
  return {
    id: task.id,
    title: '',
    status: task.status,
    starred: false,
    sortOrder: task.sortOrder,
    createdAt: task.createdAt,
    updatedAt: t,
    deletedAt: t,
  };
}

export const isDeleted = (task: Task): boolean => task.deletedAt !== undefined;
