/** A sub-step of a task. Stored inside the task record (merged with it, D-013). */
export interface Step {
  id: string;
  title: string;
  done: boolean;
  /** 1: shown under the step before it (one level of nesting, like Google Tasks). Absent: top level. */
  level?: 1;
}

export const MAX_STEPS = 50;
export const MAX_STEP_TITLE = 500;

/** How often a task comes back once it is completed (it needs a due date). */
/** `workdays` is Sunday to Thursday, the working week of the people this is made for (D-035). */
export type Repeat = 'daily' | 'workdays' | 'weekly' | 'monthly' | 'yearly';
export const REPEATS: readonly Repeat[] = ['daily', 'workdays', 'weekly', 'monthly', 'yearly'];

/** A task («نية»). Dates are `YYYY-MM-DD` civil dates; instants are epoch milliseconds. */
export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'open' | 'done';
  starred: boolean;
  /** Due date, civil `YYYY-MM-DD`, no time zone. */
  due?: string;
  /** Time of day of the due date, `HH:MM` (24 h, local, no time zone). Needs `due`. */
  dueTime?: string;
  /**
   * Completing a repeating task moves `due` to the next occurrence and keeps the task open (one
   * record, so two devices completing the same occurrence agree instead of duplicating).
   */
  repeat?: Repeat;
  steps?: Step[];
  /** The list it belongs to. Absent = the main list. A list that no longer exists = main too. */
  listId?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  doneAt?: number;
  /** Set only on a tombstone (D-006). A tombstone keeps no content. */
  deletedAt?: number;
}

export const MAX_LISTS = 50;
/** How many deletions (tasks or lists) can be undone one after another. */
export const MAX_UNDO = 10;
export const MAX_LIST_NAME = 100;

/** A list's colour: a name from a fixed palette (the values live in the design tokens). */
export const LIST_COLORS = [
  'blue',
  'green',
  'amber',
  'red',
  'purple',
  'teal',
  'pink',
  'gray',
] as const;
export type ListColor = (typeof LIST_COLORS)[number];
export const isListColor = (v: unknown): v is ListColor => LIST_COLORS.some((c) => c === v);

/** A named list of tasks (D-017). The main list is implicit: it has no record. */
export interface TaskList {
  id: string;
  name: string;
  /** Absent = no colour (the default look). */
  color?: ListColor;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  /** Set only on a tombstone (D-006). */
  deletedAt?: number;
}
