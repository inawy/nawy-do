import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Task, TaskList, TrashEntry } from '@/core/model';
import type { ListRepository, TaskRepository } from '@/core/ports';

export interface TrashApi {
  /** Everything deleted lately whose content is still kept, newest deletion first. */
  items: TrashEntry[];
  restore: (entry: TrashEntry) => Promise<void>;
  /** «Delete forever»: the content goes, the delete stays. */
  deleteForever: (entries: readonly TrashEntry[]) => Promise<void>;
}

/** The trash: what was deleted lately, with restore and delete-forever. */
export function useTrash(
  tasks: TaskRepository,
  lists: ListRepository,
  now: () => number,
): TrashApi {
  const [taskItems, setTaskItems] = useState<Task[]>([]);
  const [listItems, setListItems] = useState<TaskList[]>([]);
  useEffect(() => tasks.watchTrash(setTaskItems, () => setTaskItems([])), [tasks]);
  useEffect(() => lists.watchTrash(setListItems, () => setListItems([])), [lists]);

  const items = useMemo<TrashEntry[]>(
    () =>
      [
        ...taskItems.map(
          (t): TrashEntry => ({
            kind: 'task',
            id: t.id,
            title: t.title,
            deletedAt: t.deletedAt ?? 0,
          }),
        ),
        ...listItems.map(
          (l): TrashEntry => ({
            kind: 'list',
            id: l.id,
            title: l.name,
            deletedAt: l.deletedAt ?? 0,
            color: l.color,
          }),
        ),
      ].sort((a, b) => b.deletedAt - a.deletedAt),
    [taskItems, listItems],
  );

  const restore = useCallback(
    async (e: TrashEntry) => {
      await (e.kind === 'task' ? tasks : lists)
        .restoreFromTrash(e.id, now())
        .catch(() => undefined);
    },
    [tasks, lists, now],
  );
  const deleteForever = useCallback(
    async (entries: readonly TrashEntry[]) => {
      const ids = (kind: TrashEntry['kind']) =>
        entries.filter((e) => e.kind === kind).map((e) => e.id);
      await tasks.deleteForever(ids('task'), now()).catch(() => undefined);
      await lists.deleteForever(ids('list'), now()).catch(() => undefined);
    },
    [tasks, lists, now],
  );
  return { items, restore, deleteForever };
}
