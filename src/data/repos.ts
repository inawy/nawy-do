import type { Repositories } from '@/core/ports';
import { exportBackup, importBackup } from './backup';
import {
  addList,
  deleteListsForever,
  editListById,
  removeList,
  restoreListFromTrash,
  restoreRemovedList,
  saveListOrder,
} from './lists';
import { watchLists, watchTasks, watchTrash, watchTrashedLists } from './live';
import { purgeTombstones } from './purge';
import type { NawyDoDb } from './schema';
import { snapshotDaily } from './autosnapshot';
import { listSnapshots, snapshotKind } from './snapshot';
import {
  addTask,
  completeTaskById,
  completeTasksByIds,
  removeTasksByIds,
  deleteForever,
  restoreFromTrash,
  editTask,
  moveTasksToList,
  removeTask,
  reopenTaskById,
  restoreRemoved,
  saveOrder,
} from './store';

/** The IndexedDB (Dexie) adapter for the storage ports. The only thing that knows `NawyDoDb`. */
export function createDexieRepositories(db: NawyDoDb): Repositories {
  return {
    tasks: {
      watch: (onChange, onError) => watchTasks(db, onChange, onError),
      add: (id, title, now, options) => addTask(db, id, title, now, options),
      edit: (id, patch, now) => editTask(db, id, patch, now),
      complete: (id, now, today) => completeTaskById(db, id, now, today),
      reopen: (id, now) => reopenTaskById(db, id, now),
      remove: (id, now) => removeTask(db, id, now),
      restore: (previous, now) => restoreRemoved(db, previous, now),
      saveOrder: (changes, now) => saveOrder(db, changes, now),
      moveToList: (ids, listId, now) => moveTasksToList(db, ids, listId, now),
      completeMany: (ids, now, today) => completeTasksByIds(db, ids, now, today),
      removeMany: (ids, now) => removeTasksByIds(db, ids, now),
      watchTrash: (onChange, onError) => watchTrash(db, onChange, onError),
      restoreFromTrash: (id, now) => restoreFromTrash(db, id, now),
      deleteForever: (ids, now) => deleteForever(db, ids, now),
      tidy: async (now) => {
        try {
          await purgeTombstones(db, now);
        } catch {
          // Housekeeping only: a failure must never stop the app.
        }
      },
    },
    lists: {
      watch: (onChange, onError) => watchLists(db, onChange, onError),
      add: (id, name, now, color) => addList(db, id, name, now, color),
      edit: (id, patch, now) => editListById(db, id, patch, now),
      remove: (id, now) => removeList(db, id, now),
      restore: (previous, now) => restoreRemovedList(db, previous, now),
      saveOrder: (changes, now) => saveListOrder(db, changes, now),
      watchTrash: (onChange, onError) => watchTrashedLists(db, onChange, onError),
      restoreFromTrash: (id, now) => restoreListFromTrash(db, id, now),
      deleteForever: (ids, now) => deleteListsForever(db, ids, now),
    },
    backup: {
      export: (now) => exportBackup(db, now),
      import: (text, options) => importBackup(db, text, options),
      safetyCopies: async () =>
        (await listSnapshots()).flatMap((s) =>
          s.id === undefined
            ? []
            : [
                {
                  id: s.id,
                  createdAt: s.createdAt,
                  fromVersion: s.fromVersion,
                  json: s.json,
                  kind: snapshotKind(s),
                },
              ],
        ),
      autoSnapshot: (now) => snapshotDaily(db, now),
    },
  };
}
