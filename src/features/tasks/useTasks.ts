import { useCallback, useEffect, useState } from 'react';
import { groupTasks, planMove, type Task, type TaskPatch } from '@/core/model';
import type { NewTaskOptions, TaskRepository } from '@/core/ports';

export interface TasksApi {
  tasks: Task[];
  /** False until the first read finished. */
  ready: boolean;
  /** The database could not be opened or read. */
  failed: boolean;
  /** The task just deleted, available to undo until dismissed. */
  lastRemoved: Task | null;
  add: (title: string, options?: NewTaskOptions) => Promise<void>;
  toggle: (task: Task) => Promise<void>;
  edit: (task: Task, patch: TaskPatch) => Promise<void>;
  /** Moves an open task to `toIndex` of the displayed (newest-first) list. */
  move: (id: string, toIndex: number) => Promise<void>;
  /** Moves a selection to a list (`undefined`: the main list). */
  moveMany: (ids: readonly string[], listId: string | undefined) => Promise<void>;
  completeMany: (ids: readonly string[]) => Promise<void>;
  remove: (task: Task) => Promise<void>;
  undoRemove: () => Promise<void>;
  dismissUndo: () => void;
}

/** Time and ids are injected so nothing below the app reads the clock or makes ids (D-005). */
export function useTasks(repo: TaskRepository, now: () => number, newId: () => string): TasksApi {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lastRemoved, setLastRemoved] = useState<Task | null>(null);

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

  const toggle = useCallback(
    async (task: Task) => {
      await guard(() =>
        task.status === 'open' ? repo.complete(task.id, now()) : repo.reopen(task.id, now()),
      );
    },
    [repo, now, guard],
  );

  const edit = useCallback(
    async (task: Task, patch: TaskPatch) => {
      await guard(() => repo.edit(task.id, patch, now()));
    },
    [repo, now, guard],
  );

  const move = useCallback(
    async (id: string, toIndex: number) => {
      const changes = planMove(groupTasks(tasks).open, id, toIndex);
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
      await guard(() => repo.completeMany(ids, now()));
    },
    [repo, now, guard],
  );

  const remove = useCallback(
    async (task: Task) => {
      await guard(async () => {
        await repo.remove(task.id, now());
        setLastRemoved(task);
      });
    },
    [repo, now, guard],
  );

  const undoRemove = useCallback(async () => {
    if (!lastRemoved) return;
    const task = lastRemoved;
    setLastRemoved(null);
    await guard(() => repo.restore(task, now()));
  }, [repo, now, guard, lastRemoved]);

  const dismissUndo = useCallback(() => setLastRemoved(null), []);

  return {
    tasks,
    ready,
    failed,
    lastRemoved,
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
