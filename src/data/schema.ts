import Dexie, { type EntityTable } from 'dexie';
import type { Task, TaskList } from '@/core/model';

export const DEFAULT_DB_NAME = 'nawy-do';

export type NawyDoDb = Dexie & {
  tasks: EntityTable<Task, 'id'>;
  lists: EntityTable<TaskList, 'id'>;
};

/** The newest schema version this build declares (see `createDb`). */
export const DB_VERSION = 2;

/**
 * A schema change means a NEW `db.version(n)` block — never an edit to an existing one — plus a
 * migration test (D-008).
 */
export function createDb(name: string = DEFAULT_DB_NAME): NawyDoDb {
  const db = new Dexie(name) as NawyDoDb;
  db.version(1).stores({ tasks: 'id, status, due, sortOrder, updatedAt' });
  // v2 (D-017): lists, and an index on tasks.listId. Additive: no record is rewritten.
  db.version(2).stores({
    tasks: 'id, status, due, sortOrder, updatedAt, listId',
    lists: 'id, sortOrder, updatedAt',
  });
  return db;
}
