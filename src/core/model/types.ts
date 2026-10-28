/** A sub-step of a task. Stored inside the task record (merged with it, D-013). */
export interface Step {
  id: string;
  title: string;
  done: boolean;
}

export const MAX_STEPS = 50;
export const MAX_STEP_TITLE = 500;

/** A task («نية»). Dates are `YYYY-MM-DD` civil dates; instants are epoch milliseconds. */
export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'open' | 'done';
  starred: boolean;
  /** Due date, civil `YYYY-MM-DD`, no time zone. */
  due?: string;
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
export const MAX_LIST_NAME = 100;

/** A named list of tasks (D-017). The main list is implicit: it has no record. */
export interface TaskList {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  /** Set only on a tombstone (D-006). */
  deletedAt?: number;
}
