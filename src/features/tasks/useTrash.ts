import { useCallback, useEffect, useState } from 'react';
import type { Task } from '@/core/model';
import type { TaskRepository } from '@/core/ports';

export interface TrashApi {
  /** Deleted tasks whose content is still kept, newest deletion first. */
  items: Task[];
  restore: (id: string) => Promise<void>;
  /** «Delete forever»: the content goes, the delete stays. */
  deleteForever: (ids: readonly string[]) => Promise<void>;
}

/** The trash: what was deleted lately, with restore and delete-forever. */
export function useTrash(repo: TaskRepository, now: () => number): TrashApi {
  const [items, setItems] = useState<Task[]>([]);
  useEffect(() => repo.watchTrash(setItems, () => setItems([])), [repo]);

  const restore = useCallback(
    async (id: string) => {
      await repo.restoreFromTrash(id, now()).catch(() => undefined);
    },
    [repo, now],
  );
  const deleteForever = useCallback(
    async (ids: readonly string[]) => {
      await repo.deleteForever(ids, now()).catch(() => undefined);
    },
    [repo, now],
  );
  return { items, restore, deleteForever };
}
