import { useState } from 'react';
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
import { IconButton, MenuIcon } from '../primitives';
import { AddButton, AddSheet, TaskList as Tasks, UndoToast } from '../tasks';
import '../styles/index.css';
import { Drawer } from './Drawer';
import { InputBar } from './InputBar';
import { Notices } from './Notices';
import { ListSheets } from './ListSheets';
import { Nav, navOrder } from './Nav';
import { TitleBar } from './TitleBar';
import type { TasksScreenProps } from './types';
import { usePageSwipe } from './usePageSwipe';
import { useScreenState } from './useScreenState';

export type { DataProps, TasksScreenProps } from './types';

/** The whole screen as a function of its props: easy to test and to preview without a database. */
export function TasksScreen(p: TasksScreenProps) {
  const { t } = useI18n();
  const ui = useScreenState(p.focusAdd === true);
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

  const openData = () => {
    p.data.onOpen();
    ui.setDataOpen(true);
  };
  const order = navOrder(p.lists);
  const [slide, setSlide] = useState<'next' | 'prev' | undefined>();
  const pageSwipe = usePageSwipe(
    (delta) => {
      const target = order[order.indexOf(selection) + delta];
      if (target === undefined) return;
      ui.reset();
      setSlide(delta > 0 ? 'next' : 'prev');
      p.onSelect(target);
    },
    ui.picked === null && ui.query === null,
  );

  const header = (
    <>
      <TitleBar
        title={viewTitle}
        searchOn={ui.query !== null}
        selecting={ui.picked !== null}
        onSearch={ui.toggleSearch}
        onSelect={ui.toggleSelecting}
        sort={
          isSortable(selection) && !ui.searching ? { mode: p.sort, onChange: p.onSort } : undefined
        }
        onListOptions={list ? () => ui.setSheet({ mode: 'edit', id: list.id }) : undefined}
      />
      <InputBar
        lists={p.lists}
        picked={ui.picked}
        query={ui.query}
        onQuery={ui.setQuery}
        onMoveMany={p.onMoveMany}
        onCompleteMany={p.onCompleteMany}
        onDone={ui.stopSelecting}
      />
    </>
  );

  return (
    <div className="shell">
      <header className="side-head">
        <IconButton
          label={t('menu.drawer')}
          aria-haspopup="dialog"
          onClick={() => ui.setMenuOpen(true)}
        >
          <MenuIcon />
        </IconButton>
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
      <main
        className="main"
        data-slide={slide}
        onAnimationEnd={() => setSlide(undefined)}
        {...pageSwipe}
      >
        <Notices p={p} onOpenData={openData} />
        {p.failed ? (
          <div className="card">
            {header}
            <p className="status" role="alert">
              {t('notice.storageFailed')}
            </p>
          </div>
        ) : !p.ready ? (
          <div className="card">
            {header}
            <p className="status">{t('notice.loading')}</p>
          </div>
        ) : (
          <Tasks
            tasks={visible}
            today={p.today}
            view={ui.searching ? 'search' : selection}
            onToggle={p.onToggle}
            onStar={p.onStar}
            onOpen={p.onOpen}
            sort={p.sort}
            onLongPress={(t) => ui.startSelecting(t.id)}
            onMove={p.onMove}
            onDropOnList={(id, target) =>
              p.onMoveMany([id], target === 'main' ? undefined : target)
            }
            picked={ui.picked ?? undefined}
            onPick={ui.pick}
            header={header}
          />
        )}
      </main>
      {ui.picked === null && ui.query === null && <AddButton onClick={() => ui.setAdding(true)} />}
      {ui.menuOpen && (
        <Drawer onClose={() => ui.setMenuOpen(false)} onInstall={p.onInstall} onData={openData} />
      )}
      {ui.adding && <AddSheet onAdd={p.onAdd} onClose={() => ui.setAdding(false)} />}
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
