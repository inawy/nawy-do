import { err, ok, type Result } from './result';
import { APP_ID, SCHEMA_VERSION, type Envelope } from './envelope';
import {
  MAX_LISTS,
  MAX_LIST_NAME,
  MAX_STEPS,
  MAX_STEP_TITLE,
  type Step,
  type Task,
  type TaskList,
} from './types';

// Google Tasks (Takeout → Tasks/Tasks.json) → this app's backup envelope. Pure: the caller
// supplies `now`. Ids are derived from Google's, so importing the same file twice merges instead
// of duplicating. Google's first list is its default one, so it becomes the main list here.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

/** True for a Takeout / API task-lists JSON (cheap check, no conversion). */
export function isGoogleTasks(raw: unknown): boolean {
  if (!isObj(raw)) return false;
  const kind = str(raw['kind']);
  return kind === 'tasks#taskLists' || kind === 'tasks#taskList';
}

const time = (v: unknown, fallback: number): number => {
  const ms = typeof v === 'string' ? Date.parse(v) : NaN;
  return Number.isFinite(ms) && ms > 0 ? ms : fallback;
};

/** Google stores a due date as midnight UTC of the civil date: the date part is the date. */
const civil = (v: unknown): string | undefined => {
  const m = typeof v === 'string' ? /^(\d{4}-\d{2}-\d{2})/.exec(v) : null;
  return m?.[1];
};

const gid = (id: string): string => `g-${id}`.slice(0, 100);

function convertTasks(items: Obj[], listId: string | undefined, now: number): Task[] {
  const live = items.filter((i) => i['deleted'] !== true && str(i['id']));
  const byParent = new Map<string, Obj[]>();
  for (const i of live) {
    const parent = str(i['parent']);
    if (parent) byParent.set(parent, [...(byParent.get(parent) ?? []), i]);
  }
  const ids = new Set(live.map((i) => str(i['id'])));
  const tops = live.filter((i) => {
    const parent = str(i['parent']);
    return !parent || !ids.has(parent);
  });
  const byPos = (a: Obj, b: Obj) =>
    (str(a['position']) ?? '').localeCompare(str(b['position']) ?? '');
  const out: Task[] = [];
  for (const [index, i] of tops.sort(byPos).entries()) {
    const title = (str(i['title']) ?? '').trim().slice(0, 1000);
    const id = str(i['id']) ?? '';
    const updatedAt = time(i['updated'], now);
    const done = i['status'] === 'completed';
    const task: Task = {
      id: gid(id),
      title,
      status: done ? 'done' : 'open',
      starred: false,
      sortOrder: (index + 1) * 1000,
      createdAt: updatedAt,
      updatedAt,
    };
    const notes = str(i['notes'])?.slice(0, 20_000);
    if (notes?.trim()) task.notes = notes;
    const due = civil(i['due']);
    if (due) task.due = due;
    if (done) task.doneAt = time(i['completed'], updatedAt);
    if (listId) task.listId = listId;
    const steps: Step[] = (byParent.get(id) ?? [])
      .sort(byPos)
      .map((s) => ({
        id: gid(str(s['id']) ?? ''),
        title: (str(s['title']) ?? '').trim().slice(0, MAX_STEP_TITLE),
        done: s['status'] === 'completed',
      }))
      .filter((s) => s.title !== '')
      .slice(0, MAX_STEPS);
    if (steps.length > 0) task.steps = steps;
    // A task without a title is not worth importing, unless it has steps to keep.
    const fallback = steps[0]?.title ?? '';
    if (title !== '' || fallback !== '') out.push({ ...task, title: title || fallback });
  }
  return out;
}

/** Converts a parsed Google Tasks JSON to an envelope the normal import accepts. */
export function googleTasksToEnvelope(raw: unknown, now: number): Result<Envelope, 'not-google'> {
  if (!isGoogleTasks(raw) || !isObj(raw)) return err('not-google');
  const lists: Obj[] = Array.isArray(raw['items'])
    ? raw['kind'] === 'tasks#taskLists'
      ? raw['items'].filter(isObj)
      : []
    : [];
  if (raw['kind'] === 'tasks#taskList') lists.push(raw);

  const outLists: TaskList[] = [];
  const tasks: Task[] = [];
  for (const [n, l] of lists.entries()) {
    const items = Array.isArray(l['items']) ? l['items'].filter(isObj) : [];
    let listId: string | undefined;
    if (n > 0 && outLists.length < MAX_LISTS) {
      const updated = time(l['updated'], now);
      const name = (str(l['title']) ?? '').trim().slice(0, MAX_LIST_NAME) || '…';
      listId = gid(str(l['id']) ?? `list-${n}`);
      outLists.push({
        id: listId,
        name,
        sortOrder: (outLists.length + 1) * 1000,
        createdAt: updated,
        updatedAt: updated,
      });
    }
    tasks.push(...convertTasks(items, listId, now));
  }
  return ok({
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    tasks,
    lists: outLists,
  });
}
