import { createDb, type NawyDoDb } from '@/data';

let instance: NawyDoDb | undefined;
/** One shared database per page, opened lazily. */
export function getDb(): NawyDoDb {
  instance ??= createDb();
  return instance;
}
