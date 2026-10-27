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
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  doneAt?: number;
  /** Set only on a tombstone (D-006). A tombstone keeps no content. */
  deletedAt?: number;
}
