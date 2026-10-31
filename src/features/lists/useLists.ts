import { useCallback, useEffect, useState } from 'react';
import { planListMove, type TaskList } from '@/core/model';
import type { ListRepository } from '@/core/ports';

export interface ListsApi {
  lists: TaskList[];
  /** The list just deleted, available to undo until dismissed. */
  lastRemoved: TaskList | null;
  /** Returns the new list, or why it was refused. */
  add: (name: string) => Promise<TaskList | 'empty' | 'limit' | 'failed'>;
  rename: (list: TaskList, name: string) => Promise<void>;
  remove: (list: TaskList) => Promise<void>;
  /** One place earlier (-1) or later (+1) in the navigation. */
  move: (list: TaskList, delta: -1 | 1) => Promise<void>;
  undoRemove: () => Promise<void>;
  dismissUndo: () => void;
}

/** `now` is injected so nothing below the app reads the clock (D-005). */
export function useLists(repo: ListRepository, now: () => number, newId: () => string): ListsApi {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [lastRemoved, setLastRemoved] = useState<TaskList | null>(null);

  useEffect(() => repo.watch(setLists, () => undefined), [repo]);

  const add = useCallback(
    async (name: string) => {
      try {
        const result = await repo.add(newId(), name, now());
        return result.ok ? result.list : result.reason;
      } catch {
        return 'failed' as const;
      }
    },
    [repo, now, newId],
  );

  const rename = useCallback(
    async (list: TaskList, name: string) => {
      await repo.rename(list.id, name, now()).catch(() => undefined);
    },
    [repo, now],
  );

  const remove = useCallback(
    async (list: TaskList) => {
      const done = await repo.remove(list.id, now()).catch(() => undefined);
      if (done) setLastRemoved(list);
    },
    [repo, now],
  );

  const move = useCallback(
    async (list: TaskList, delta: -1 | 1) => {
      await repo.saveOrder(planListMove(lists, list.id, delta), now()).catch(() => undefined);
    },
    [repo, now, lists],
  );

  const undoRemove = useCallback(async () => {
    if (!lastRemoved) return;
    const list = lastRemoved;
    setLastRemoved(null);
    await repo.restore(list, now()).catch(() => undefined);
  }, [repo, now, lastRemoved]);

  const dismissUndo = useCallback(() => setLastRemoved(null), []);

  return { lists, lastRemoved, add, rename, remove, move, undoRemove, dismissUndo };
}
