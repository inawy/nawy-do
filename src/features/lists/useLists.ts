import { useCallback, useEffect, useState } from 'react';
import {
  MAX_UNDO,
  planListMove,
  type ListColor,
  type ListPatch,
  type TaskList,
} from '@/core/model';
import type { ListRepository } from '@/core/ports';

export interface ListsApi {
  lists: TaskList[];
  /** The last write did not go through. */
  writeFailed: boolean;
  /** The lists deleted lately, newest last; each undo takes the newest back. */
  removedStack: TaskList[];
  lastRemoved: TaskList | null;
  /** Returns the new list, or why it was refused. */
  add: (name: string, color?: ListColor) => Promise<TaskList | 'empty' | 'limit' | 'failed'>;
  edit: (list: TaskList, patch: ListPatch) => Promise<void>;
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
  const [writeFailed, setWriteFailed] = useState(false);
  const attempt = useCallback(async <T>(run: () => Promise<T>): Promise<T | undefined> => {
    try {
      const result = await run();
      setWriteFailed(false);
      return result;
    } catch {
      setWriteFailed(true);
      return undefined;
    }
  }, []);

  useEffect(() => repo.watch(setLists, () => undefined), [repo]);

  const add = useCallback(
    async (name: string, color?: ListColor) => {
      try {
        const result = await repo.add(newId(), name, now(), color);
        return result.ok ? result.list : result.reason;
      } catch {
        return 'failed' as const;
      }
    },
    [repo, now, newId],
  );

  const edit = useCallback(
    async (list: TaskList, patch: ListPatch) => {
      await attempt(() => repo.edit(list.id, patch, now()));
    },
    [repo, now, attempt],
  );

  const remove = useCallback(
    async (list: TaskList) => {
      const done = await attempt(() => repo.remove(list.id, now()));
      if (done) setRemovedStack((s) => [...s, list].slice(-MAX_UNDO));
    },
    [repo, now, attempt],
  );

  const move = useCallback(
    async (list: TaskList, delta: -1 | 1) => {
      await attempt(() => repo.saveOrder(planListMove(lists, list.id, delta), now()));
    },
    [repo, now, lists, attempt],
  );

  const undoRemove = useCallback(async () => {
    const list = removedStack[removedStack.length - 1];
    if (!list) return;
    setRemovedStack((s) => s.slice(0, -1));
    await attempt(() => repo.restore(list, now()));
  }, [repo, now, removedStack, attempt]);

  const dismissUndo = useCallback(() => setRemovedStack([]), []);

  return {
    lists,
    writeFailed,
    removedStack,
    lastRemoved: removedStack[removedStack.length - 1] ?? null,
    add,
    edit,
    remove,
    move,
    undoRemove,
    dismissUndo,
  };
}
