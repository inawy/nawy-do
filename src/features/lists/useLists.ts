import { useCallback, useEffect, useState } from 'react';
import type { TaskList } from '@/core/model';
import {
  addList,
  removeList,
  renameListById,
  restoreRemovedList,
  watchLists,
  type NawyDoDb,
} from '@/data';

export interface ListsApi {
  lists: TaskList[];
  /** The list just deleted, available to undo until dismissed. */
  lastRemoved: TaskList | null;
  /** Returns the new list, or why it was refused. */
  add: (name: string) => Promise<TaskList | 'empty' | 'limit' | 'failed'>;
  rename: (list: TaskList, name: string) => Promise<void>;
  remove: (list: TaskList) => Promise<void>;
  undoRemove: () => Promise<void>;
  dismissUndo: () => void;
}

/** `now` is injected so nothing below the app reads the clock (D-005). */
export function useLists(db: NawyDoDb, now: () => number): ListsApi {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [lastRemoved, setLastRemoved] = useState<TaskList | null>(null);

  useEffect(() => watchLists(db, setLists, () => undefined), [db]);

  const add = useCallback(
    async (name: string) => {
      try {
        const result = await addList(db, crypto.randomUUID(), name, now());
        return result.ok ? result.list : result.reason;
      } catch {
        return 'failed' as const;
      }
    },
    [db, now],
  );

  const rename = useCallback(
    async (list: TaskList, name: string) => {
      await renameListById(db, list.id, name, now()).catch(() => undefined);
    },
    [db, now],
  );

  const remove = useCallback(
    async (list: TaskList) => {
      const done = await removeList(db, list.id, now()).catch(() => undefined);
      if (done) setLastRemoved(list);
    },
    [db, now],
  );

  const undoRemove = useCallback(async () => {
    if (!lastRemoved) return;
    const list = lastRemoved;
    setLastRemoved(null);
    await restoreRemovedList(db, list, now()).catch(() => undefined);
  }, [db, now, lastRemoved]);

  const dismissUndo = useCallback(() => setLastRemoved(null), []);

  return { lists, lastRemoved, add, rename, remove, undoRemove, dismissUndo };
}
