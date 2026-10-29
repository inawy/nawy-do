import { useCallback, useEffect, useState } from 'react';
import { groupTasks, planMove, type Task, type TaskPatch } from '@/core/model';
import {
  addTask,
  type NewTaskOptions,
  completeTaskById,
  completeTasksByIds,
  moveTasksToList,
  editTask,
  removeTask,
  reopenTaskById,
  restoreRemoved,
  saveOrder,
  watchTasks,
  type NawyDoDb,
} from '@/data';

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

/** `now` is injected so nothing below the app reads the clock (D-005). */
export function useTasks(db: NawyDoDb, now: () => number): TasksApi {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lastRemoved, setLastRemoved] = useState<Task | null>(null);

  useEffect(
    () =>
      watchTasks(
        db,
        (list) => {
          setTasks(list);
          setReady(true);
        },
        () => setFailed(true),
      ),
    [db],
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
      await guard(() => addTask(db, crypto.randomUUID(), title, now(), options));
    },
    [db, now, guard],
  );

  const toggle = useCallback(
    async (task: Task) => {
      await guard(() =>
        task.status === 'open'
          ? completeTaskById(db, task.id, now())
          : reopenTaskById(db, task.id, now()),
      );
    },
    [db, now, guard],
  );

  const edit = useCallback(
    async (task: Task, patch: TaskPatch) => {
      await guard(() => editTask(db, task.id, patch, now()));
    },
    [db, now, guard],
  );

  const move = useCallback(
    async (id: string, toIndex: number) => {
      const changes = planMove(groupTasks(tasks).open, id, toIndex);
      if (changes.length === 0) return;
      await guard(() => saveOrder(db, changes, now()));
    },
    [db, now, guard, tasks],
  );

  const moveMany = useCallback(
    async (ids: readonly string[], listId: string | undefined) => {
      await guard(() => moveTasksToList(db, ids, listId, now()));
    },
    [db, now, guard],
  );

  const completeMany = useCallback(
    async (ids: readonly string[]) => {
      await guard(() => completeTasksByIds(db, ids, now()));
    },
    [db, now, guard],
  );

  const remove = useCallback(
    async (task: Task) => {
      await guard(async () => {
        await removeTask(db, task.id, now());
        setLastRemoved(task);
      });
    },
    [db, now, guard],
  );

  const undoRemove = useCallback(async () => {
    if (!lastRemoved) return;
    const task = lastRemoved;
    setLastRemoved(null);
    await guard(() => restoreRemoved(db, task, now()));
  }, [db, now, guard, lastRemoved]);

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
