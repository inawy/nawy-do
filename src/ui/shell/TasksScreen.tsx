import {
  countsFor,
  isSortable,
  resolveSelection,
  searchTasks,
  selectedListId,
  tasksIn,
} from '@/core/model';
import { BackupSheet } from '../backup';
import { useI18n } from '../i18n';
import { DetailsSheet } from '../details';
import { TaskList as Tasks, UndoToast } from '../tasks';
import '../styles/index.css';
import { InputBar } from './InputBar';
import { ListSheets } from './ListSheets';
import { Nav } from './Nav';
import { TitleBar } from './TitleBar';
import type { TasksScreenProps } from './types';
import { useScreenState } from './useScreenState';

export type { DataProps, TasksScreenProps } from './types';

/** The whole screen as a function of its props: easy to test and to preview without a database. */
export function TasksScreen(p: TasksScreenProps) {
  const { t, num } = useI18n();
  const ui = useScreenState();
  const selection = resolveSelection(p.selection, p.lists);
  const list = p.lists.find((l) => l.id === selectedListId(selection));
  const visible =
    ui.searching && ui.query !== null
      ? searchTasks(p.tasks, ui.query)
      : tasksIn(p.tasks, p.lists, selection, p.today);
  const { editing } = p;
  const viewTitle = list
    ? list.name
    : t(`view.${selection as 'main' | 'today' | 'starred' | 'scheduled'}`);

  return (
    <div className="shell">
      <header className="side-head">
        <p className="brand">{t('app.name')}</p>
      </header>
      <Nav
        selection={selection}
        counts={countsFor(p.tasks, p.lists, p.today)}
        lists={p.lists}
        onSelect={(s) => {
          ui.reset();
          p.onSelect(s);
        }}
        onNewList={() => ui.setSheet({ mode: 'create' })}
      />
      <main className="main">
        {p.dueNotice && (
          <div className="update" role="status">
            <span>
              {t('notice.attention')}{' '}
              {[
                p.dueNotice.overdue > 0 && t('notice.overdue', { count: num(p.dueNotice.overdue) }),
                p.dueNotice.today > 0 && t('notice.today', { count: num(p.dueNotice.today) }),
              ]
                .filter(Boolean)
                .join('، ')}
            </span>
            <button type="button" onClick={p.dueNotice.onShow}>
              {t('notice.show')}
            </button>
            <button type="button" className="later" onClick={p.dueNotice.onLater}>
              {t('notice.later')}
            </button>
          </div>
        )}
        {p.backupNudge && !p.dueNotice && (
          <div className="update" role="status">
            <span>{t('notice.backup')}</span>
            <button
              type="button"
              onClick={() => {
                p.data.onOpen();
                ui.setDataOpen(true);
              }}
            >
              {t('notice.backupDo')}
            </button>
            <button type="button" className="later" onClick={p.backupNudge.onLater}>
              {t('notice.later')}
            </button>
          </div>
        )}
        {p.applyUpdate && (
          <div className="update" role="status">
            <span>{t('notice.update')}</span>
            <button type="button" onClick={p.applyUpdate}>
              {t('notice.updateDo')}
            </button>
          </div>
        )}
        <TitleBar
          title={viewTitle}
          searchOn={ui.query !== null}
          selecting={ui.picked !== null}
          onSearch={ui.toggleSearch}
          onSelect={ui.toggleSelecting}
          onInstall={p.onInstall}
          sort={
            isSortable(selection) && !ui.searching
              ? { mode: p.sort, onChange: p.onSort }
              : undefined
          }
          onData={() => {
            p.data.onOpen();
            ui.setDataOpen(true);
          }}
          onListOptions={list ? () => ui.setSheet({ mode: 'edit', id: list.id }) : undefined}
        />
        <InputBar
          lists={p.lists}
          focusAdd={p.focusAdd}
          picked={ui.picked}
          query={ui.query}
          onAdd={p.onAdd}
          onQuery={ui.setQuery}
          onMoveMany={p.onMoveMany}
          onCompleteMany={p.onCompleteMany}
          onDone={ui.stopSelecting}
        />
        {p.writeFailed && (
          <p className="status" role="alert">
            {t('notice.writeFailed')}
          </p>
        )}
        {p.failed ? (
          <p className="status" role="alert">
            {t('notice.storageFailed')}
          </p>
        ) : !p.ready ? (
          <p className="status">{t('notice.loading')}</p>
        ) : (
          <Tasks
            tasks={visible}
            today={p.today}
            view={ui.searching ? 'search' : selection}
            onToggle={p.onToggle}
            onStar={p.onStar}
            onOpen={p.onOpen}
            onRemove={p.onRemove}
            sort={p.sort}
            onLongPress={(t) => ui.startSelecting(t.id)}
            onMove={p.onMove}
            onDropOnList={(id, target) =>
              p.onMoveMany([id], target === 'main' ? undefined : target)
            }
            picked={ui.picked ?? undefined}
            onPick={ui.pick}
          />
        )}
      </main>
      {editing && (
        <DetailsSheet
          key={editing.id}
          task={editing}
          lists={p.lists}
          today={p.today}
          newId={p.newId}
          onSave={(patch) => p.onSave(editing, patch)}
          onRemove={() => {
            p.onRemove(editing);
            p.onClose();
          }}
          onClose={p.onClose}
        />
      )}
      <ListSheets
        sheet={ui.sheet}
        lists={p.lists}
        onClose={() => ui.setSheet(null)}
        onSelect={p.onSelect}
        onAdd={p.onAddList}
        onEdit={p.onEditList}
        onDelete={p.onDeleteList}
        onMove={p.onMoveList}
      />
      {ui.dataOpen && (
        <BackupSheet
          storage={p.data.storage}
          snapshots={p.data.snapshots}
          outcome={p.data.outcome}
          onExport={p.data.onExport}
          onShare={p.data.onShare}
          lastExport={p.data.lastExport}
          onImport={p.data.onImport}
          onRestore={p.data.onRestore}
          onClose={() => ui.setDataOpen(false)}
        />
      )}
      {p.removed && (
        <UndoToast
          message={
            t(p.removed.kind === 'list' ? 'toast.removedList' : 'toast.removed', {
              name: p.removed.label,
            }) + (p.removed.more > 0 ? ` (+${p.removed.more})` : '')
          }
          onUndo={p.onUndo}
          onDismiss={p.onDismissUndo}
        />
      )}
    </div>
  );
}
