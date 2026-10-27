import {
  completeTask,
  createTask,
  isDeleted,
  mergeTask,
  reopenTask,
  tombstoneTask,
  updateTask,
  type Task,
  type TaskPatch,
} from '@/core/model';
import type { NawyDoDb } from './schema';

/** Live (not deleted) tasks, in display order. */
export async function listTasks(db: NawyDoDb): Promise<Task[]> {
  const all = await db.tasks.toArray();
  return all
    .filter((t) => !isDeleted(t))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

/** Every record including tombstones: what an export or a sync needs. */
export function allRecords(db: NawyDoDb): Promise<Task[]> {
  return db.tasks.toArray();
}

export async function addTask(db: NawyDoDb, id: string, title: string, now: number): Promise<Task> {
  const task = createTask(id, title, now);
  await db.tasks.add(task);
  return task;
}

/** Read-modify-write inside one transaction. Missing or deleted records are left alone. */
async function change(
  db: NawyDoDb,
  id: string,
  fn: (task: Task) => Task,
): Promise<Task | undefined> {
  return db.transaction('rw', db.tasks, async () => {
    const current = await db.tasks.get(id);
    if (!current || isDeleted(current)) return undefined;
    const next = fn(current);
    if (next !== current) await db.tasks.put(next);
    return next;
  });
}

export const editTask = (db: NawyDoDb, id: string, patch: TaskPatch, now: number) =>
  change(db, id, (t) => updateTask(t, patch, now));
export const completeTaskById = (db: NawyDoDb, id: string, now: number) =>
  change(db, id, (t) => completeTask(t, now));
export const reopenTaskById = (db: NawyDoDb, id: string, now: number) =>
  change(db, id, (t) => reopenTask(t, now));
/** Deleting writes a tombstone; the record is never removed here (D-006). */
export const removeTask = (db: NawyDoDb, id: string, now: number) =>
  change(db, id, (t) => tombstoneTask(t, now));

/** Merge incoming records into the database with the record-level rule (D-006). */
export async function applyRecords(db: NawyDoDb, incoming: readonly Task[]): Promise<number> {
  return db.transaction('rw', db.tasks, async () => {
    let changed = 0;
    for (const record of incoming) {
      const existing = await db.tasks.get(record.id);
      const winner = existing ? mergeTask(existing, record) : record;
      if (winner !== existing) {
        await db.tasks.put(winner);
        changed++;
      }
    }
    return changed;
  });
}
