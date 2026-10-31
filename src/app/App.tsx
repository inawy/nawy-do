import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { selectedListId, type Selection } from '@/core/model';
import type { NewTaskOptions, Repositories } from '@/core/ports';
import { createDexieRepositories, type NawyDoDb } from '@/data';
import { useBackup } from '@/features/backup';
import { useLists } from '@/features/lists';
import { useTasks } from '@/features/tasks';
import { TasksScreen } from '@/ui/shell';
import { formatWhen, systemClock, systemToday } from './clock';
import { getDb } from './db';
import { downloadText } from './files';
import { newId } from './ids';
import { requestPersistence, type StorageState } from './storage';
import { updateSignal } from './updateSignal';

interface Props {
  /** Storage: the repositories to use, or a Dexie database to wrap, or (by default) the app's own. */
  repositories?: Repositories;
  db?: NawyDoDb;
  now?: () => number;
  today?: () => string;
}

/** The only place that wires features to the screen. */
export function App({ repositories, db, now = systemClock, today = systemToday }: Props) {
  const repos = useMemo(
    () => repositories ?? createDexieRepositories(db ?? getDb()),
    [repositories, db],
  );
  const tasks = useTasks(repos.tasks, now, newId);
  const lists = useLists(repos.lists, now, newId);
  const backup = useBackup(repos.backup, now);
  const applyUpdate = useSyncExternalStore(updateSignal.subscribe, updateSignal.get);
  const [chosen, setChosen] = useState<Selection>('main');
  const [storage, setStorage] = useState<StorageState | 'unknown'>('unknown');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void requestPersistence().then(setStorage);
  }, []);

  // A list that no longer exists (deleted here or elsewhere) falls back to the main list.
  const chosenList = selectedListId(chosen);
  const selection: Selection =
    chosenList !== undefined && !lists.lists.some((l) => l.id === chosenList) ? 'main' : chosen;

  // A new intention takes on the context it is added in.
  const optionsFor = (s: Selection): NewTaskOptions => {
    const listId = selectedListId(s);
    if (listId !== undefined) return { listId };
    if (s === 'starred') return { starred: true };
    if (s === 'scheduled') return { due: today() };
    return {};
  };

  // The sheet shows the task as it is now; if it was deleted elsewhere it simply closes.
  const editing = tasks.tasks.find((t) => t.id === openId);

  const removed = lists.lastRemoved
    ? { kind: 'list' as const, label: lists.lastRemoved.name }
    : tasks.lastRemoved
      ? { kind: 'task' as const, label: tasks.lastRemoved.title }
      : null;

  return (
    <TasksScreen
      data={{
        storage,
        snapshots: backup.snapshots.map((s) => ({ id: s.id, label: formatWhen(s.createdAt) })),
        outcome: backup.outcome,
        onOpen: () => void backup.refresh(),
        onExport: () =>
          void backup.exportJson().then((text) => downloadText(`nawy-do-${today()}.json`, text)),
        onImport: (file) => void file.text().then(backup.importText),
        onRestore: (id) => void backup.restore(id),
      }}
      tasks={tasks.tasks}
      lists={lists.lists}
      today={today()}
      selection={selection}
      ready={tasks.ready}
      failed={tasks.failed}
      editing={editing}
      removed={removed}
      applyUpdate={applyUpdate}
      onSelect={setChosen}
      onAdd={(title) => void tasks.add(title, optionsFor(selection))}
      onToggle={(t) => void tasks.toggle(t)}
      onStar={(t) => void tasks.edit(t, { starred: !t.starred })}
      onOpen={(t) => setOpenId(t.id)}
      onMove={(id, to) => void tasks.move(id, to)}
      onMoveMany={(ids, listId) => void tasks.moveMany(ids, listId)}
      onCompleteMany={(ids) => void tasks.completeMany(ids)}
      onClose={() => setOpenId(null)}
      onSave={(t, patch) => void tasks.edit(t, patch)}
      onRemove={(t) => void tasks.remove(t)}
      onAddList={lists.add}
      onRenameList={(l, name) => void lists.rename(l, name)}
      onDeleteList={(l) => void lists.remove(l)}
      onMoveList={(l, delta) => void lists.move(l, delta)}
      onUndo={() => void (lists.lastRemoved ? lists.undoRemove() : tasks.undoRemove())}
      onDismissUndo={() => {
        lists.dismissUndo();
        tasks.dismissUndo();
      }}
    />
  );
}
