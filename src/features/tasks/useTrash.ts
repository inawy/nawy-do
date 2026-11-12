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

const taskEntry = (t: Task): TrashEntry => ({
  kind: 'task',
  id: t.id,
  title: t.title,
  deletedAt: t.deletedAt ?? 0,
});
const listEntry = (l: TaskList): TrashEntry => ({
  kind: 'list',
  id: l.id,
  title: l.name,
  deletedAt: l.deletedAt ?? 0,
  color: l.color,
});
const idsOf = (entries: readonly TrashEntry[], kind: TrashEntry['kind']) =>
  entries.filter((e) => e.kind === kind).map((e) => e.id);
const newestFirst = (a: TrashEntry, b: TrashEntry) => b.deletedAt - a.deletedAt;

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

  const items = useMemo(
    () => [...taskItems.map(taskEntry), ...listItems.map(listEntry)].sort(newestFirst),
    [taskItems, listItems],
  );

  const restore = useCallback(
    async (e: TrashEntry) => {
      if (e.kind === 'task') await tasks.restoreFromTrash(e.id, now()).catch(() => undefined);
      else await lists.restoreFromTrash(e.id, now()).catch(() => undefined);
    },
    [tasks, lists, now],
  );
  const deleteForever = useCallback(
    async (entries: readonly TrashEntry[]) => {
      await tasks.deleteForever(idsOf(entries, 'task'), now()).catch(() => undefined);
      await lists.deleteForever(idsOf(entries, 'list'), now()).catch(() => undefined);
    },
    [tasks, lists, now],
  );
  return { items, restore, deleteForever };
}
