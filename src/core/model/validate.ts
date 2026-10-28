import { isCivilDate } from './civil';
import { err, ok, type Result } from './result';
import {
  MAX_LIST_NAME,
  MAX_STEPS,
  MAX_STEP_TITLE,
  type Step,
  type Task,
  type TaskList,
} from './types';

const MAX_TITLE = 1000;
const MAX_NOTES = 20_000;

const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

function parseSteps(raw: unknown): Step[] | undefined {
  if (!Array.isArray(raw) || raw.length > MAX_STEPS) return undefined;
  const seen = new Set<string>();
  const out: Step[] = [];
  for (const item of raw as unknown[]) {
    if (typeof item !== 'object' || item === null) return undefined;
    const o = item as Record<string, unknown>;
    const { id, title, done } = o;
    if (typeof id !== 'string' || id === '' || id.length > 100 || seen.has(id)) return undefined;
    if (typeof title !== 'string' || title.length > MAX_STEP_TITLE) return undefined;
    if (typeof done !== 'boolean') return undefined;
    seen.add(id);
    out.push({ id, title, done });
  }
  return out;
}

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
  if (r['steps'] !== undefined) {
    const steps = parseSteps(r['steps']);
    if (!steps) return err('steps');
    task.steps = steps;
  }
  if (r['listId'] !== undefined) {
    if (typeof r['listId'] !== 'string' || r['listId'] === '' || r['listId'].length > 100) {
      return err('listId');
    }
    task.listId = r['listId'];
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

/** Same gate for lists. Unknown fields are dropped. */
export function parseList(raw: unknown): Result<TaskList, string> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return err('not-an-object');
  const r = raw as Record<string, unknown>;
  const id = r['id'];
  if (typeof id !== 'string' || id === '' || id.length > 100) return err('id');
  if (typeof r['name'] !== 'string' || r['name'].length > MAX_LIST_NAME) return err('name');
  if (typeof r['sortOrder'] !== 'number' || !Number.isFinite(r['sortOrder']))
    return err('sortOrder');
  if (!isTime(r['createdAt'])) return err('createdAt');
  if (!isTime(r['updatedAt'])) return err('updatedAt');
  const list: TaskList = {
    id,
    name: r['name'],
    sortOrder: r['sortOrder'],
    createdAt: r['createdAt'],
    updatedAt: r['updatedAt'],
  };
  if (r['deletedAt'] !== undefined) {
    if (!isTime(r['deletedAt'])) return err('deletedAt');
    list.deletedAt = r['deletedAt'];
  }
  return ok(list);
}
