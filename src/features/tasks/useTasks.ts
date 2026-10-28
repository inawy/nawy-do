import { useCallback, useEffect, useState } from 'react';
import { groupTasks, planMove, type Task, type TaskPatch } from '@/core/model';
import {
  addTask,
  completeTaskById,
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
  add: (title: string) => Promise<void>;
  toggle: (task: Task) => Promise<void>;
  edit: (task: Task, patch: TaskPatch) => Promise<void>;
  /** Moves an open task to `toIndex` of the displayed (newest-first) list. */
  move: (id: string, toIndex: number) => Promise<void>;
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
    async (title: string) => {
      if (title.trim() === '') return;
      await guard(() => addTask(db, crypto.randomUUID(), title, now()));
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
    remove,
    undoRemove,
    dismissUndo,
  };
}
