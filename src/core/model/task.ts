import { isCivilDate, isCivilTime } from './civil';
import { isRepeating, nextDue, seriesEnds } from './recurrence';
import {
  intervalRepeat,
  MAX_REPEAT_EVERY,
  MAX_REPEAT_TIMES,
  MAX_STEPS,
  MAX_STEP_TITLE,
  type Repeat,
  type Step,
  type Task,
} from './types';

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
  Pick<Task, 'title' | 'notes' | 'starred' | 'due' | 'dueTime' | 'sortOrder' | 'steps' | 'listId'>
> & {
  /** `''` removes the repetition. */
  repeat?: Repeat | '';
  /** `1` or `undefined` removes the interval. */
  repeatEvery?: number;
  /** A date (`YYYY-MM-DD`) the repeat stops after; `''` removes the limit. */
  repeatUntil?: string;
  /** How many occurrences in all, this one included; `0` or `undefined` removes the limit. */
  repeatTimes?: number;
};

/** Trims titles, drops empty ones and duplicate ids, and caps the count. */
export function cleanSteps(steps: readonly Step[]): Step[] {
  const seen = new Set<string>();
  const out: Step[] = [];
  for (const step of steps) {
    const title = step.title.trim().slice(0, MAX_STEP_TITLE);
    if (title === '' || seen.has(step.id)) continue;
    seen.add(step.id);
    // A nested step needs a step before it to hang under.
    out.push(
      step.level === 1 && out.length > 0
        ? { id: step.id, title, done: step.done, level: 1 }
        : { id: step.id, title, done: step.done },
    );
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
  const { repeat, repeatEvery, repeatUntil, repeatTimes, ...rest } = patch;
  const next: Task = { ...task, ...rest, updatedAt: nextUpdatedAt(task.updatedAt, now) };
  if ('repeat' in patch) {
    if (repeat === undefined || repeat === '') delete next.repeat;
    else next.repeat = repeat;
  }
  if ('repeatEvery' in patch) {
    if (repeatEvery !== undefined && repeatEvery >= 2) {
      next.repeatEvery = Math.min(MAX_REPEAT_EVERY, Math.floor(repeatEvery));
    } else delete next.repeatEvery;
  }
  if ('repeatUntil' in patch) {
    if (repeatUntil) next.repeatUntil = repeatUntil;
    else delete next.repeatUntil;
  }
  if ('repeatTimes' in patch) {
    if (repeatTimes !== undefined && repeatTimes >= 1) {
      next.repeatTimes = Math.min(MAX_REPEAT_TIMES, Math.floor(repeatTimes));
    } else delete next.repeatTimes;
  }
  if (next.repeatUntil !== undefined) delete next.repeatTimes; // one limit at a time
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (title === '') next.title = task.title;
    else next.title = title;
  }
  if ('notes' in patch && (patch.notes === undefined || patch.notes.trim() === '')) {
    delete next.notes;
  }
  if ('listId' in patch && (patch.listId === undefined || patch.listId === '')) {
    delete next.listId;
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
  if ('dueTime' in patch) {
    if (patch.dueTime === undefined || patch.dueTime === '') delete next.dueTime;
    else if (!isCivilTime(patch.dueTime)) {
      if (task.dueTime === undefined) delete next.dueTime;
      else next.dueTime = task.dueTime;
    }
  }
  // A repetition and a time of day need a date to hang on.
  if (next.due === undefined) {
    delete next.repeat;
    delete next.dueTime;
  }
  if (!intervalRepeat(next.repeat)) delete next.repeatEvery;
  if (next.repeat === undefined) {
    delete next.repeatUntil;
    delete next.repeatTimes;
  }
  return next;
}

/**
 * Completes a task. A repeating one is not finished: its due date moves to the next occurrence
 * (after `today`), its steps start over, and it stays open.
 */
export function completeTask(task: Task, now: number, today: string): Task {
  if (task.status === 'done') return task;
  const t = nextUpdatedAt(task.updatedAt, now);
  if (isRepeating(task)) {
    const due = nextDue(task.due, task.repeat, today, task.repeatEvery);
    // The last occurrence: the series is over, so it finishes like any other task.
    if (seriesEnds(task, due)) return { ...task, status: 'done', doneAt: t, updatedAt: t };
    const next: Task = { ...task, due, updatedAt: t };
    if (task.repeatTimes !== undefined) next.repeatTimes = task.repeatTimes - 1;
    if (task.steps) next.steps = task.steps.map((s) => ({ ...s, done: false }));
    return next;
  }
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

/** How long a deleted task stays readable in the trash before only its tombstone is kept. */
export const TRASH_DAYS = 30;
export const TRASH_TTL_MS = TRASH_DAYS * 24 * 60 * 60 * 1000;

/**
 * Deleting moves a task to the trash: the record is stamped deleted but keeps its content, so it
 * can be read and restored for `TRASH_DAYS`. After that (or on «delete forever») it is compacted
 * to a tombstone with `tombstoneTask`, which keeps no content (ADR 0042).
 */
export function trashTask(task: Task, now: number): Task {
  const t = nextUpdatedAt(task.updatedAt, now);
  return { ...task, updatedAt: t, deletedAt: t };
}

/** Deleted and still readable: what the trash shows (a compacted tombstone has no title). */
export const isTrashed = (task: Task): boolean => isDeleted(task) && task.title !== '';

/** Takes a trashed task back as it was, stamped newer so the restore wins every merge. */
export function untrashTask(current: Task, now: number): Task {
  const next: Task = { ...current, updatedAt: nextUpdatedAt(current.updatedAt, now) };
  delete next.deletedAt;
  return next;
}

/**
 * Undo of a delete: the previous live record again, stamped newer than the tombstone so the
 * restore wins every merge (D-006).
 */
export function restoreTask(previous: Task, current: Task, now: number): Task {
  const next: Task = { ...previous, updatedAt: nextUpdatedAt(current.updatedAt, now) };
  delete next.deletedAt;
  return next;
}

/** What a copy of `task` keeps: list, date, time, repeat, star, notes and steps (all unchecked). */
export function duplicateOptions(task: Task) {
  const options: {
    listId?: string;
    starred?: boolean;
    due?: string;
    dueTime?: string;
    repeat?: Repeat;
    repeatEvery?: number;
    repeatUntil?: string;
    repeatTimes?: number;
    notes?: string;
    steps?: Step[];
  } = {};
  if (task.listId) options.listId = task.listId;
  if (task.starred) options.starred = true;
  if (task.due) {
    options.due = task.due;
    if (task.dueTime) options.dueTime = task.dueTime;
    if (task.repeat) options.repeat = task.repeat;
    if (task.repeatEvery) options.repeatEvery = task.repeatEvery;
    if (task.repeatUntil) options.repeatUntil = task.repeatUntil;
    if (task.repeatTimes) options.repeatTimes = task.repeatTimes;
  }
  if (task.notes) options.notes = task.notes;
  if (task.steps?.length) options.steps = task.steps.map((s) => ({ ...s, done: false }));
  return options;
}
