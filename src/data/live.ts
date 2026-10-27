import { liveQuery } from 'dexie';
import type { Task } from '@/core/model';
import type { NawyDoDb } from './schema';
import { listTasks } from './store';

/** Calls `onChange` with the live tasks now and after every change (also from another tab). */
export function watchTasks(
  db: NawyDoDb,
  onChange: (tasks: Task[]) => void,
  onError: (error: unknown) => void,
): () => void {
  const sub = liveQuery(() => listTasks(db)).subscribe({ next: onChange, error: onError });
  return () => sub.unsubscribe();
}
