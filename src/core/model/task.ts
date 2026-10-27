import { isCivilDate } from './civil';
import { MAX_STEPS, MAX_STEP_TITLE, type Step, type Task } from './types';

/**
 * The next `updatedAt`: the current time, but strictly greater than the previous value, so two
 * writes in one millisecond (or a clock that stepped back) still order correctly. `updatedAt`
 * is the clock that decides merges.
 */
export function nextUpdatedAt(previous: number, now: number): number {
  return Math.max(now, previous + 1);
}

export function createTask(id: string, title: string, now: number, sortOrder = now): Task {
  return {
    id,
    title: title.trim(),
    status: 'open',
    starred: false,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'notes' | 'starred' | 'due' | 'sortOrder' | 'steps'>
>;

/** Trims titles, drops empty ones and duplicate ids, and caps the count. */
export function cleanSteps(steps: readonly Step[]): Step[] {
  const seen = new Set<string>();
  const out: Step[] = [];
  for (const step of steps) {
    const title = step.title.trim().slice(0, MAX_STEP_TITLE);
    if (title === '' || seen.has(step.id)) continue;
    seen.add(step.id);
    out.push({ id: step.id, title, done: step.done });
    if (out.length === MAX_STEPS) break;
  }
  return out;
}

export function stepProgress(task: Task): { done: number; total: number } | undefined {
  const steps = task.steps;
  if (!steps || steps.length === 0) return undefined;
  return { done: steps.filter((x) => x.done).length, total: steps.length };
}

/**
 * Applies a patch. An empty title or an invalid date is ignored (the old value stays); `notes`
 * or `due` set to `undefined` or `''` removes the field.
 */
export function updateTask(task: Task, patch: TaskPatch, now: number): Task {
  const next: Task = { ...task, ...patch, updatedAt: nextUpdatedAt(task.updatedAt, now) };
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (title === '') next.title = task.title;
    else next.title = title;
  }
  if ('notes' in patch && (patch.notes === undefined || patch.notes.trim() === '')) {
    delete next.notes;
  }
  if ('steps' in patch) {
    const steps = cleanSteps(patch.steps ?? []);
    if (steps.length === 0) delete next.steps;
    else next.steps = steps;
  }
  if ('due' in patch) {
    if (patch.due === undefined || patch.due === '') delete next.due;
    else if (!isCivilDate(patch.due)) {
      if (task.due === undefined) delete next.due;
      else next.due = task.due;
    }
  }
  return next;
}

export function completeTask(task: Task, now: number): Task {
  if (task.status === 'done') return task;
  const t = nextUpdatedAt(task.updatedAt, now);
  return { ...task, status: 'done', doneAt: t, updatedAt: t };
}

export function reopenTask(task: Task, now: number): Task {
  if (task.status === 'open') return task;
  const next: Task = { ...task, status: 'open', updatedAt: nextUpdatedAt(task.updatedAt, now) };
  delete next.doneAt;
  return next;
}

/** Deleting never removes a record; it replaces it with a tombstone that keeps no content. */
export function tombstoneTask(task: Task, now: number): Task {
  const t = nextUpdatedAt(task.updatedAt, now);
  return {
    id: task.id,
    title: '',
    status: task.status,
    starred: false,
    sortOrder: task.sortOrder,
    createdAt: task.createdAt,
    updatedAt: t,
    deletedAt: t,
  };
}

export const isDeleted = (task: Task): boolean => task.deletedAt !== undefined;

/**
 * Undo of a delete: the previous live record again, stamped newer than the tombstone so the
 * restore wins every merge (D-006).
 */
export function restoreTask(previous: Task, current: Task, now: number): Task {
  const next: Task = { ...previous, updatedAt: nextUpdatedAt(current.updatedAt, now) };
  delete next.deletedAt;
  return next;
}
