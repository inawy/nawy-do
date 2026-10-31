import type {
  EnvelopeError,
  EnvelopeOptions,
  ListOrderChange,
  OrderChange,
  Result,
  Task,
  TaskList,
  TaskPatch,
} from '../model';

// Ports (D-024): what the application needs from storage, written as interfaces in the core. The
// features and UI depend on these, never on Dexie. `data/` holds the adapter that implements them
// on IndexedDB; tests use an in-memory one. Swapping storage means a new adapter, no other change.
// Every method takes `now` explicitly: nothing below the app reads the clock (D-005).

export interface NewTaskOptions {
  listId?: string;
  starred?: boolean;
  due?: string;
}

/** Calls `onChange` now and after every change (also from another tab); returns the unsubscribe. */
export type Watch<T> = (
  onChange: (items: T[]) => void,
  onError: (error: unknown) => void,
) => () => void;

export interface TaskRepository {
  /** Live (not deleted) tasks, in display order. */
  watch: Watch<Task>;
  add(id: string, title: string, now: number, options?: NewTaskOptions): Promise<Task>;
  edit(id: string, patch: TaskPatch, now: number): Promise<Task | undefined>;
  complete(id: string, now: number): Promise<Task | undefined>;
  reopen(id: string, now: number): Promise<Task | undefined>;
  /** A tombstone; nothing is removed (D-006). */
  remove(id: string, now: number): Promise<Task | undefined>;
  /** Undo of `remove`: does nothing if the task is gone or was already restored. */
  restore(previous: Task, now: number): Promise<Task | undefined>;
  saveOrder(changes: readonly OrderChange[], now: number): Promise<number>;
  /** `listId` undefined moves them to the main list. Returns how many changed. */
  moveToList(ids: readonly string[], listId: string | undefined, now: number): Promise<number>;
  completeMany(ids: readonly string[], now: number): Promise<number>;
}

export type AddListResult = { ok: true; list: TaskList } | { ok: false; reason: 'empty' | 'limit' };

export interface ListRepository {
  /** Live lists in display order. */
  watch: Watch<TaskList>;
  add(id: string, name: string, now: number): Promise<AddListResult>;
  rename(id: string, name: string, now: number): Promise<TaskList | undefined>;
  remove(id: string, now: number): Promise<TaskList | undefined>;
  restore(previous: TaskList, now: number): Promise<TaskList | undefined>;
  saveOrder(changes: readonly ListOrderChange[], now: number): Promise<number>;
}

export type ImportResult = Result<
  { total: number; changed: number; lists: number; listsChanged: number },
  EnvelopeError
>;

/** A safety copy taken before a schema upgrade (D-017). `json` is a backup file of that version. */
export interface SafetyCopy {
  id: number;
  createdAt: number;
  fromVersion: number;
  json: string;
}

export interface BackupRepository {
  /** The backup file's text. */
  export(now: number): Promise<string>;
  /** Parse first, write after, all or nothing; existing data is merged, not replaced (D-006). */
  import(text: string, options?: EnvelopeOptions): Promise<ImportResult>;
  safetyCopies(): Promise<SafetyCopy[]>;
}

/** Everything the app gets from storage. */
export interface Repositories {
  tasks: TaskRepository;
  lists: ListRepository;
  backup: BackupRepository;
}
