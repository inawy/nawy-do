import type { Task } from './types';

/** Anything that merges by the record-level rule: tasks and lists. */
export interface Mergeable {
  id: string;
  updatedAt: number;
  deletedAt?: number;
}

/**
 * Record-level merge: the newer `updatedAt` wins. On a tie a tombstone wins (a delete is never
 * silently undone), then the larger JSON string, so the result never depends on argument order.
 */
export function mergeRecord<T extends Mergeable>(a: T, b: T): T {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  const aDel = a.deletedAt !== undefined;
  const bDel = b.deletedAt !== undefined;
  if (aDel !== bDel) return aDel ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

/** Merge two collections by id. Commutative and idempotent. Order of the result is unspecified. */
export function mergeRecords<T extends Mergeable>(local: readonly T[], remote: readonly T[]): T[] {
  const byId = new Map<string, T>();
  for (const record of [...local, ...remote]) {
    const existing = byId.get(record.id);
    byId.set(record.id, existing ? mergeRecord(existing, record) : record);
  }
  return [...byId.values()];
}

export const mergeTask = (a: Task, b: Task): Task => mergeRecord(a, b);

/** Merge two task collections; sorted by `sortOrder` for a stable result. */
export function mergeTasks(local: readonly Task[], remote: readonly Task[]): Task[] {
  return mergeRecords(local, remote).sort(
    (x, y) => x.sortOrder - y.sortOrder || x.id.localeCompare(y.id),
  );
}
