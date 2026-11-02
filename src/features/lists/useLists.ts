import { useCallback, useEffect, useState } from 'react';
import { MAX_UNDO, planListMove, type TaskList } from '@/core/model';
import type { ListRepository } from '@/core/ports';

export interface ListsApi {
  lists: TaskList[];
  /** The lists deleted lately, newest last; each undo takes the newest back. */
  removedStack: TaskList[];
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
  const [removedStack, setRemovedStack] = useState<TaskList[]>([]);

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
      if (done) setRemovedStack((s) => [...s, list].slice(-MAX_UNDO));
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
    const list = removedStack[removedStack.length - 1];
    if (!list) return;
    setRemovedStack((s) => s.slice(0, -1));
    await repo.restore(list, now()).catch(() => undefined);
  }, [repo, now, removedStack]);

  const dismissUndo = useCallback(() => setRemovedStack([]), []);

  return {
    lists,
    removedStack,
    lastRemoved: removedStack[removedStack.length - 1] ?? null,
    add,
    rename,
    remove,
    move,
    undoRemove,
    dismissUndo,
  };
}
