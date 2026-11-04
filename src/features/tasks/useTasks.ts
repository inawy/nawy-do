import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_UNDO, planMove, type Task, type TaskPatch } from '@/core/model';
import type { NewTaskOptions, TaskRepository } from '@/core/ports';

export interface TasksApi {
  tasks: Task[];
  /** False until the first read finished. */
  ready: boolean;
  /** The database could not be opened or read. */
  failed: boolean;
  /** The tasks deleted lately, newest last; each undo takes the newest back. */
  removedStack: Task[];
  /** The newest of them (or null). */
  lastRemoved: Task | null;
  add: (title: string, options?: NewTaskOptions) => Promise<void>;
  toggle: (task: Task) => Promise<void>;
  edit: (task: Task, patch: TaskPatch) => Promise<void>;
  /**
   * Moves an open task to `toIndex` of the list on screen. `shown` is that list's
   * ids in display order: the index means nothing against any other ordering.
   */
  move: (id: string, toIndex: number, shown: readonly string[]) => Promise<void>;
  /** Moves a selection to a list (`undefined`: the main list). */
  moveMany: (ids: readonly string[], listId: string | undefined) => Promise<void>;
  completeMany: (ids: readonly string[]) => Promise<void>;
  remove: (task: Task) => Promise<void>;
  undoRemove: () => Promise<void>;
  dismissUndo: () => void;
}

/** Time and ids are injected so nothing below the app reads the clock or makes ids (D-005). */
export function useTasks(
  repo: TaskRepository,
  now: () => number,
  newId: () => string,
  today: () => string,
): TasksApi {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [removedStack, setRemovedStack] = useState<Task[]>([]);

  useEffect(
    () =>
      repo.watch(
        (list) => {
          setTasks(list);
          setReady(true);
        },
        () => setFailed(true),
      ),
    [repo],
  );

  const guard = useCallback(async (run: () => Promise<unknown>) => {
    try {
      await run();
    } catch {
      setFailed(true);
    }
  }, []);

  const add = useCallback(
    async (title: string, options?: NewTaskOptions) => {
      if (title.trim() === '') return;
      await guard(() => repo.add(newId(), title, now(), options));
    },
    [repo, now, newId, guard],
  );

  // A second tap (or swipe + tap) on a task whose first write is still running would complete a
  // repeating task twice and skip an occurrence, so one toggle per task at a time.
  const toggling = useRef(new Set<string>());
  const toggle = useCallback(
    async (task: Task) => {
      if (toggling.current.has(task.id)) return;
      toggling.current.add(task.id);
      try {
        await guard(() =>
          task.status === 'open'
            ? repo.complete(task.id, now(), today())
            : repo.reopen(task.id, now()),
        );
      } finally {
        toggling.current.delete(task.id);
      }
    },
    [repo, now, today, guard],
  );

  const edit = useCallback(
    async (task: Task, patch: TaskPatch) => {
      await guard(() => repo.edit(task.id, patch, now()));
    },
    [repo, now, guard],
  );

  const move = useCallback(
    async (id: string, toIndex: number, shown: readonly string[]) => {
      const byId = new Map(tasks.map((t) => [t.id, t]));
      const displayed = shown.flatMap((s) => byId.get(s) ?? []);
      const changes = planMove(displayed, id, toIndex);
      if (changes.length === 0) return;
      await guard(() => repo.saveOrder(changes, now()));
    },
    [repo, now, guard, tasks],
  );

  const moveMany = useCallback(
    async (ids: readonly string[], listId: string | undefined) => {
      await guard(() => repo.moveToList(ids, listId, now()));
    },
    [repo, now, guard],
  );

  const completeMany = useCallback(
    async (ids: readonly string[]) => {
      await guard(() => repo.completeMany(ids, now(), today()));
    },
    [repo, now, today, guard],
  );

  const remove = useCallback(
    async (task: Task) => {
      await guard(async () => {
        await repo.remove(task.id, now());
        setRemovedStack((s) => [...s, task].slice(-MAX_UNDO));
      });
    },
    [repo, now, guard],
  );

  const undoRemove = useCallback(async () => {
    const task = removedStack[removedStack.length - 1];
    if (!task) return;
    setRemovedStack((s) => s.slice(0, -1));
    await guard(() => repo.restore(task, now()));
  }, [repo, now, guard, removedStack]);

  const dismissUndo = useCallback(() => setRemovedStack([]), []);

  return {
    tasks,
    ready,
    failed,
    removedStack,
    lastRemoved: removedStack[removedStack.length - 1] ?? null,
    add,
    toggle,
    edit,
    move,
    moveMany,
    completeMany,
    remove,
    undoRemove,
    dismissUndo,
  };
}
