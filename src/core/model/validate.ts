import { isCivilDate } from './civil';
import { err, ok, type Result } from './result';
import type { Task } from './types';

const MAX_TITLE = 1000;
const MAX_NOTES = 20_000;

const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/**
 * The only gate for data coming from outside (import, storage): anything it accepts, the app
 * itself could have written. Unknown fields are dropped.
 */
export function parseTask(raw: unknown): Result<Task, string> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return err('not-an-object');
  const r = raw as Record<string, unknown>;
  const id = r['id'];
  if (typeof id !== 'string' || id === '' || id.length > 100) return err('id');
  if (typeof r['title'] !== 'string' || r['title'].length > MAX_TITLE) return err('title');
  if (r['status'] !== 'open' && r['status'] !== 'done') return err('status');
  if (typeof r['starred'] !== 'boolean') return err('starred');
  if (typeof r['sortOrder'] !== 'number' || !Number.isFinite(r['sortOrder']))
    return err('sortOrder');
  if (!isTime(r['createdAt'])) return err('createdAt');
  if (!isTime(r['updatedAt'])) return err('updatedAt');

  const task: Task = {
    id,
    title: r['title'],
    status: r['status'],
    starred: r['starred'],
    sortOrder: r['sortOrder'],
    createdAt: r['createdAt'],
    updatedAt: r['updatedAt'],
  };
  if (r['notes'] !== undefined) {
    if (typeof r['notes'] !== 'string' || r['notes'].length > MAX_NOTES) return err('notes');
    task.notes = r['notes'];
  }
  if (r['due'] !== undefined) {
    if (typeof r['due'] !== 'string' || !isCivilDate(r['due'])) return err('due');
    task.due = r['due'];
  }
  if (r['doneAt'] !== undefined) {
    if (!isTime(r['doneAt'])) return err('doneAt');
    task.doneAt = r['doneAt'];
  }
  if (r['deletedAt'] !== undefined) {
    if (!isTime(r['deletedAt'])) return err('deletedAt');
    task.deletedAt = r['deletedAt'];
  }
  return ok(task);
}
