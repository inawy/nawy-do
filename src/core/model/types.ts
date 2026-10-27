/** A task («نية»). Dates are `YYYY-MM-DD` civil dates; instants are epoch milliseconds. */
export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'open' | 'done';
  starred: boolean;
  /** Due date, civil `YYYY-MM-DD`, no time zone. */
  due?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  doneAt?: number;
  /** Set only on a tombstone (D-006). A tombstone keeps no content. */
  deletedAt?: number;
}
