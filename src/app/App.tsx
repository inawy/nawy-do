import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  dueSummary,
  type DueSummary,
  needsBackupNudge,
  newTaskDefaults,
  resolveSelection,
  type Selection,
  type SortMode,
} from '@/core/model';
import type { Repositories } from '@/core/ports';
import { createDexieRepositories, type NawyDoDb } from '@/data';
import { useBackup } from '@/features/backup';
import { useLists } from '@/features/lists';
import { useTasks } from '@/features/tasks';
import { TasksScreen } from '@/ui/shell';
import { formatWhen, systemClock, systemToday } from './clock';
import { getDb } from './db';
import { canShareFile, downloadText, shareText } from './files';
import { installSignal } from './install';
import { newId } from './ids';
import { loadSort, saveSort } from './prefs';
import { takeLaunch } from './launch';
import { requestPersistence, type StorageState } from './storage';
import { updateSignal } from './updateSignal';
import { useExportLog } from './useExportLog';

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
  const tasks = useTasks(repos.tasks, now, newId, today);
  const lists = useLists(repos.lists, now, newId);
  const backup = useBackup(repos.backup, now);
  const applyUpdate = useSyncExternalStore(updateSignal.subscribe, updateSignal.get);
  const onInstall = useSyncExternalStore(installSignal.subscribe, installSignal.get);
  const [launch] = useState(takeLaunch);
  const shareDone = useRef(false);
  const [sort, setSort] = useState<SortMode>(loadSort);
  const [chosen, setChosen] = useState<Selection>('main');
  const [storage, setStorage] = useState<StorageState | 'unknown'>('unknown');
  const [openId, setOpenId] = useState<string | null>(null);
  const exportLog = useExportLog(now);
  const [nudgeLater, setNudgeLater] = useState(false);
  const [dueLater, setDueLater] = useState(false);

  useEffect(() => {
    void requestPersistence().then(setStorage);
  }, []);

  const selection = resolveSelection(chosen, lists.lists);
  // What needed attention when the app opened: counted once, so adding a task later does not
  // pop the notice up mid-session.
  const [due, setDue] = useState<DueSummary | undefined>(undefined);
  const { ready: tasksReady, tasks: allTasks } = tasks;
  useEffect(() => {
    if (tasksReady && due === undefined) setDue(dueSummary(allTasks, systemToday()));
  }, [tasksReady, allTasks, due]);

  // Text shared from another app becomes a new intention (once per launch).
  const { add } = tasks;
  useEffect(() => {
    if (shareDone.current || launch.shared === undefined) return;
    shareDone.current = true;
    void add(launch.shared);
  }, [launch, add]);

  // The sheet shows the task as it is now; if it was deleted elsewhere it simply closes.
  const editing = tasks.tasks.find((t) => t.id === openId);

  const more = lists.removedStack.length + tasks.removedStack.length - 1;
  const removed = lists.lastRemoved
    ? { kind: 'list' as const, label: lists.lastRemoved.name, more }
    : tasks.lastRemoved
      ? { kind: 'task' as const, label: tasks.lastRemoved.title, more }
      : null;

  return (
    <TasksScreen
      data={{
        storage,
        snapshots: backup.snapshots.map((s) => ({
          id: s.id,
          label: `${s.kind === 'daily' ? 'تلقائية' : 'قبل تحديث'} · ${formatWhen(s.createdAt)}`,
        })),
        outcome: backup.outcome,
        onOpen: () => void backup.refresh(),
        onExport: () =>
          void backup.exportJson().then((text) => {
            downloadText(`nawy-do-${today()}.json`, text);
            exportLog.mark();
          }),
        onShare: canShareFile()
          ? () =>
              void backup
                .exportJson()
                .then((text) => shareText(`nawy-do-${today()}.json`, text))
                .then((shared) => shared && exportLog.mark())
          : undefined,
        lastExport: exportLog.last === undefined ? undefined : formatWhen(exportLog.last),
        onImport: (file) => void file.text().then(backup.importText),
        onRestore: (id) => void backup.restore(id),
      }}
      dueNotice={
        tasks.ready &&
        !tasks.failed &&
        !dueLater &&
        selection !== 'today' &&
        due.overdue + due.today > 0
          ? {
              ...due,
              onShow: () => {
                setChosen('today');
                setDueLater(true);
              },
              onLater: () => setDueLater(true),
            }
          : undefined
      }
      backupNudge={
        tasks.ready &&
        !tasks.failed &&
        !nudgeLater &&
        needsBackupNudge(exportLog.last, now(), tasks.tasks.length)
          ? { onLater: () => setNudgeLater(true) }
          : undefined
      }
      tasks={tasks.tasks}
      lists={lists.lists}
      today={today()}
      newId={newId}
      selection={selection}
      ready={tasks.ready}
      failed={tasks.failed}
      writeFailed={tasks.writeFailed || lists.writeFailed}
      editing={editing}
      removed={removed}
      sort={sort}
      onSort={(mode) => {
        setSort(mode);
        saveSort(mode);
      }}
      applyUpdate={applyUpdate}
      onInstall={onInstall}
      focusAdd={launch.newTask}
      onSelect={setChosen}
      onAdd={(title) => void tasks.add(title, newTaskDefaults(selection, today()))}
      onToggle={(t) => void tasks.toggle(t)}
      onStar={(t) => void tasks.edit(t, { starred: !t.starred })}
      onOpen={(t) => setOpenId(t.id)}
      onMove={(id, to, shown) => void tasks.move(id, to, shown)}
      onMoveMany={(ids, listId) => void tasks.moveMany(ids, listId)}
      onCompleteMany={(ids) => void tasks.completeMany(ids)}
      onClose={() => setOpenId(null)}
      onSave={(t, patch) => void tasks.edit(t, patch)}
      onRemove={(t) => void tasks.remove(t)}
      onAddList={lists.add}
      onEditList={(l, patch) => void lists.edit(l, patch)}
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
