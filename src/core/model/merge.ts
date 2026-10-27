import type { Task } from './types';

/**
 * Record-level merge: the newer `updatedAt` wins. On a tie a tombstone wins (a delete is never
 * silently undone), then the larger JSON string, so the result never depends on argument order.
 */
export function mergeTask(a: Task, b: Task): Task {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  const aDel = a.deletedAt !== undefined;
  const bDel = b.deletedAt !== undefined;
  if (aDel !== bDel) return aDel ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

/** Merge two lists by id. Commutative and idempotent. */
export function mergeTasks(local: readonly Task[], remote: readonly Task[]): Task[] {
  const byId = new Map<string, Task>();
  for (const task of [...local, ...remote]) {
    const existing = byId.get(task.id);
    byId.set(task.id, existing ? mergeTask(existing, task) : task);
  }
  return [...byId.values()].sort((x, y) => x.sortOrder - y.sortOrder || x.id.localeCompare(y.id));
}
