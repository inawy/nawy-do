import Dexie, { type EntityTable } from 'dexie';
import type { Task } from '@/core/model';

export const DEFAULT_DB_NAME = 'nawy-do';

export type NawyDoDb = Dexie & { tasks: EntityTable<Task, 'id'> };

/**
 * A schema change means a NEW `db.version(n)` block — never an edit to an existing one — plus a
 * migration test (D-008).
 */
export function createDb(name: string = DEFAULT_DB_NAME): NawyDoDb {
  const db = new Dexie(name) as NawyDoDb;
  db.version(1).stores({ tasks: 'id, status, due, sortOrder, updatedAt' });
  return db;
}
