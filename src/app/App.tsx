import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  dueSummary,
  type DueSummary,
  needsBackupNudge,
  quickTask,
  resolveSelection,
  type Selection,
  type SortMode,
} from '@/core/model';
import type { Repositories } from '@/core/ports';
import { createDexieRepositories, type NawyDoDb } from '@/data';
import { useBackup } from '@/features/backup';
import { useLists } from '@/features/lists';
import { MAX_LISTS } from '@/core/model';
import { useTasks, useTrash } from '@/features/tasks';
import { I18nProvider, makeI18n, type Lang } from '@/ui/i18n';
import { TasksScreen } from '@/ui/shell';
import { formatWhen, systemClock, systemToday } from './clock';
import { getDb } from './db';
import {
  canShareFile,
  canShareText,
  copyText,
  downloadText,
  shareText,
  shareTextOnly,
} from './files';
import { installSignal } from './install';
import { newId } from './ids';
import { loadLang, loadSort, saveLang, saveSort } from './prefs';
import { takeLaunch } from './launch';
import { requestPersistence, type StorageState } from './storage';
import { updateSignal } from './updateSignal';
import { useDay } from './useDay';
import { useExportLog } from './useExportLog';
import { useUndoTrail } from './useUndoTrail';

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
  const trash = useTrash(repos.tasks, repos.lists, now);
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
  useDay(today, now); // re-renders at midnight, so every `today()` below is the new day
  const [lang, setLangState] = useState(loadLang);
  const setLang = (l: Lang) => {
    saveLang(l);
    setLangState(l);
  };
  const i18n = makeI18n(lang);
  const exportLog = useExportLog(now);
  const [nudgeLater, setNudgeLater] = useState(false);
  const [dueLater, setDueLater] = useState(false);

  useEffect(() => {
    void requestPersistence().then(setStorage);
  }, []);
  useEffect(() => {
    void repos.tasks.tidy(now());
  }, [repos, now]);

  const selection = resolveSelection(chosen, lists.lists);
  // What needed attention when the app opened: counted once, so adding a task later does not
  // pop the notice up mid-session.
  const [due, setDue] = useState<DueSummary | undefined>(undefined);
  const { ready: tasksReady, tasks: allTasks } = tasks;
  useEffect(() => {
    if (tasksReady && due === undefined) setDue(dueSummary(allTasks, today()));
  }, [tasksReady, allTasks, due, today]);

  // Text shared from another app becomes a new intention (once per launch).
  const { add } = tasks;
  useEffect(() => {
    if (shareDone.current || launch.shared === undefined) return;
    shareDone.current = true;
    void add(launch.shared);
  }, [launch, add]);

  // The sheet shows the task as it is now; if it was deleted elsewhere it simply closes.
  const editing = tasks.tasks.find((t) => t.id === openId);

  const undo = useUndoTrail(tasks.lastRemoved, lists.lastRemoved);
  const more = lists.removedStack.length + tasks.removedStack.length - 1;
  const removed =
    undo.newest === 'list' && lists.lastRemoved
      ? { kind: 'list' as const, label: lists.lastRemoved.name, more }
      : undo.newest === 'task' && tasks.lastRemoved
        ? { kind: 'task' as const, label: tasks.lastRemoved.title, more }
        : null;

  return (
    <I18nProvider lang={lang} onLang={setLang}>
      <TasksScreen
        data={{
          storage,
          snapshots: backup.snapshots.map((s) => ({
            id: s.id,
            label: `${i18n.t(s.kind === 'daily' ? 'backup.kindDaily' : 'backup.kindUpgrade')} · ${formatWhen(s.createdAt, lang)}`,
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
          lastExport: exportLog.last === undefined ? undefined : formatWhen(exportLog.last, lang),
          onImport: (file) => void file.text().then(backup.importText),
          onRestore: (id) => void backup.restore(id),
        }}
        trash={{
          items: trash.items,
          now: now(),
          onRestore: (entry) => void trash.restore(entry),
          onDelete: (entries) => void trash.deleteForever(entries),
          listsFull: lists.lists.length >= MAX_LISTS,
        }}
        dueNotice={
          due !== undefined &&
          !tasks.failed &&
          !dueLater &&
          selection !== 'today' &&
          due.overdue + due.today > 0
            ? {
                overdue: due.overdue,
                today: due.today,
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
        onAdd={(text, literal) => {
          const q = quickTask(text, literal, selection, lists.lists, today());
          void tasks.add(q.title, q.options);
        }}
        onToggle={(t) => void tasks.toggle(t)}
        onStar={(t) => void tasks.edit(t, { starred: !t.starred })}
        onOpen={(t) => setOpenId(t.id)}
        onMove={(id, to, shown) => void tasks.move(id, to, shown)}
        onMoveMany={(ids, listId) => void tasks.moveMany(ids, listId)}
        onCompleteMany={(ids) => void tasks.completeMany(ids)}
        onRemoveMany={(ids) => void tasks.removeMany(ids)}
        onClose={() => setOpenId(null)}
        onCopy={copyText}
        onShare={canShareText() ? shareTextOnly : undefined}
        onSave={(t, patch) => void tasks.edit(t, patch)}
        onRemove={(t) => void tasks.remove(t)}
        onAddList={lists.add}
        onEditList={(l, patch) => void lists.edit(l, patch)}
        onDeleteList={(l) => void lists.remove(l)}
        onMoveList={(l, delta) => void lists.move(l, delta)}
        onUndo={() => {
          undo.popped();
          void (undo.newest === 'list' ? lists.undoRemove() : tasks.undoRemove());
        }}
        onDismissUndo={undo.hide}
      />
    </I18nProvider>
  );
}
