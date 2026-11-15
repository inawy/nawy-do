import {
  completeTask,
  createTask,
  isDeleted,
  mergeTask,
  type OrderChange,
  reopenTask,
  restoreTask,
  trashTask,
  tombstoneTask,
  untrashTask,
  isTrashed,
  updateTask,
  type Task,
  type TaskPatch,
} from '@/core/model';
import type { NewTaskOptions } from '@/core/ports';
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

export async function addTask(
  db: NawyDoDb,
  id: string,
  title: string,
  now: number,
  options: NewTaskOptions = {},
): Promise<Task> {
  const task = createTask(id, title, now);
  if (options.listId) task.listId = options.listId;
  if (options.starred) task.starred = true;
  if (options.due) task.due = options.due;
  if (options.due && options.dueTime) task.dueTime = options.dueTime;
  if (options.due && options.repeat) task.repeat = options.repeat;
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
export const completeTaskById = (db: NawyDoDb, id: string, now: number, today: string) =>
  change(db, id, (t) => completeTask(t, now, today));
export const reopenTaskById = (db: NawyDoDb, id: string, now: number) =>
  change(db, id, (t) => reopenTask(t, now));
/** Deleting moves the task to the trash; the record is never removed here (D-006, ADR 0042). */
export const removeTask = (db: NawyDoDb, id: string, now: number) =>
  change(db, id, (t) => trashTask(t, now));

/** The trash: deleted tasks whose content is still kept, newest deletion first. */
export async function listTrash(db: NawyDoDb): Promise<Task[]> {
  const all = await db.tasks.toArray();
  return all.filter(isTrashed).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
}

/** Takes a task out of the trash. Does nothing if it is not there (restored or compacted). */
export async function restoreFromTrash(
  db: NawyDoDb,
  id: string,
  now: number,
): Promise<Task | undefined> {
  return db.transaction('rw', db.tasks, async () => {
    const current = await db.tasks.get(id);
    if (!current || !isTrashed(current)) return undefined;
    const next = untrashTask(current, now);
    await db.tasks.put(next);
    return next;
  });
}

/** «Delete forever»: the trashed tasks become content-less tombstones. Returns how many. */
export async function deleteForever(
  db: NawyDoDb,
  ids: readonly string[],
  now: number,
): Promise<number> {
  return db.transaction('rw', db.tasks, async () => {
    let n = 0;
    for (const id of new Set(ids)) {
      const current = await db.tasks.get(id);
      if (!current || !isTrashed(current)) continue;
      await db.tasks.put(tombstoneTask(current, now));
      n++;
    }
    return n;
  });
}

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

/** Undo of a delete. Does nothing if the record is gone or was already restored. */
export async function restoreRemoved(
  db: NawyDoDb,
  previous: Task,
  now: number,
): Promise<Task | undefined> {
  return db.transaction('rw', db.tasks, async () => {
    const current = await db.tasks.get(previous.id);
    if (!current || !isDeleted(current)) return undefined;
    const next = restoreTask(previous, current, now);
    await db.tasks.put(next);
    return next;
  });
}

/** Writes new `sortOrder` values in one transaction; missing or deleted tasks are skipped. */
export async function saveOrder(
  db: NawyDoDb,
  changes: readonly OrderChange[],
  now: number,
): Promise<number> {
  return db.transaction('rw', db.tasks, async () => {
    let written = 0;
    for (const change of changes) {
      const current = await db.tasks.get(change.id);
      if (!current || isDeleted(current)) continue;
      await db.tasks.put(updateTask(current, { sortOrder: change.sortOrder }, now));
      written++;
    }
    return written;
  });
}

/**
 * One transaction for a whole selection: every live task in `ids` is changed with `fn`. Missing or
 * deleted ones are skipped. Returns how many were written.
 */
async function changeMany(
  db: NawyDoDb,
  ids: readonly string[],
  fn: (task: Task) => Task,
): Promise<number> {
  return db.transaction('rw', db.tasks, async () => {
    let written = 0;
    for (const id of new Set(ids)) {
      const current = await db.tasks.get(id);
      if (!current || isDeleted(current)) continue;
      const next = fn(current);
      if (next !== current) {
        await db.tasks.put(next);
        written++;
      }
    }
    return written;
  });
}

/** `listId` undefined moves them to the main list. */
export const moveTasksToList = (
  db: NawyDoDb,
  ids: readonly string[],
  listId: string | undefined,
  now: number,
) => changeMany(db, ids, (t) => updateTask(t, { listId: listId ?? '' }, now));

/** Moves the given tasks to the trash (the ones already deleted are skipped). */
export const removeTasksByIds = (db: NawyDoDb, ids: readonly string[], now: number) =>
  changeMany(db, ids, (t) => trashTask(t, now));

export const completeTasksByIds = (
  db: NawyDoDb,
  ids: readonly string[],
  now: number,
  today: string,
) => changeMany(db, ids, (t) => (t.status === 'open' ? completeTask(t, now, today) : t));
