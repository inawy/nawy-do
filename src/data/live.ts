import { liveQuery } from 'dexie';
import type { Task, TaskList } from '@/core/model';
import { listLists } from './lists';
import type { NawyDoDb } from './schema';
import { listTasks, listTrash } from './store';

/** Calls `onChange` with the live tasks now and after every change (also from another tab). */
export function watchTasks(
  db: NawyDoDb,
  onChange: (tasks: Task[]) => void,
  onError: (error: unknown) => void,
): () => void {
  const sub = liveQuery(() => listTasks(db)).subscribe({ next: onChange, error: onError });
  return () => sub.unsubscribe();
}

/** The same for the live lists. */
export function watchLists(
  db: NawyDoDb,
  onChange: (lists: TaskList[]) => void,
  onError: (error: unknown) => void,
): () => void {
  const sub = liveQuery(() => listLists(db)).subscribe({ next: onChange, error: onError });
  return () => sub.unsubscribe();
}

/** The same for the trash. */
export function watchTrash(
  db: NawyDoDb,
  onChange: (tasks: Task[]) => void,
  onError: (error: unknown) => void,
): () => void {
  const sub = liveQuery(() => listTrash(db)).subscribe({ next: onChange, error: onError });
  return () => sub.unsubscribe();
}
