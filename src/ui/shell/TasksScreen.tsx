import {
  countsFor,
  isSortable,
  resolveSelection,
  searchTasks,
  selectedListId,
  tasksIn,
} from '@/core/model';
import { BackupSheet } from '../backup';
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

const TITLES = { main: 'نواياي', today: 'اليوم', starred: 'المفضلة', scheduled: 'مجدولة' } as const;

/** The whole screen as a function of its props: easy to test and to preview without a database. */
export function TasksScreen(p: TasksScreenProps) {
  const ui = useScreenState();
  const selection = resolveSelection(p.selection, p.lists);
  const list = p.lists.find((l) => l.id === selectedListId(selection));
  const visible =
    ui.searching && ui.query !== null
      ? searchTasks(p.tasks, ui.query)
      : tasksIn(p.tasks, p.lists, selection, p.today);
  const { editing } = p;

  return (
    <div className="shell">
      <header className="side-head">
        <p className="brand">ناوي دو</p>
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
              محتاج انتباهك:{' '}
              {[
                p.dueNotice.overdue > 0 && `${p.dueNotice.overdue.toLocaleString('ar-EG')} متأخرة`,
                p.dueNotice.today > 0 && `${p.dueNotice.today.toLocaleString('ar-EG')} النهارده`,
              ]
                .filter(Boolean)
                .join('، ')}
            </span>
            <button type="button" onClick={p.dueNotice.onShow}>
              اعرضها
            </button>
            <button type="button" className="later" onClick={p.dueNotice.onLater}>
              بعدين
            </button>
          </div>
        )}
        {p.backupNudge && !p.dueNotice && (
          <div className="update" role="status">
            <span>عدّى وقت من آخر نسخة احتياطية. خُد نسخة تحفظها بره الجهاز.</span>
            <button
              type="button"
              onClick={() => {
                p.data.onOpen();
                ui.setDataOpen(true);
              }}
            >
              خُد نسخة
            </button>
            <button type="button" className="later" onClick={p.backupNudge.onLater}>
              بعدين
            </button>
          </div>
        )}
        {p.applyUpdate && (
          <div className="update" role="status">
            <span>في نسخة جديدة من ناوي دو.</span>
            <button type="button" onClick={p.applyUpdate}>
              حدّث
            </button>
          </div>
        )}
        <TitleBar
          title={list ? list.name : TITLES[selection as keyof typeof TITLES]}
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
            مقدرتش أحفظ التغيير الأخير. جرّب تاني.
          </p>
        )}
        {p.failed ? (
          <p className="status" role="alert">
            مش قادر أفتح التخزين على الجهاز. لو فاتح تصفح خاص جرّب نافذة عادية.
          </p>
        ) : !p.ready ? (
          <p className="status">جاري التحميل…</p>
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
            (p.removed.kind === 'list'
              ? `اتحذفت القائمة: ${p.removed.label}`
              : `اتحذفت: ${p.removed.label}`) + (p.removed.more > 0 ? ` (+${p.removed.more})` : '')
          }
          onUndo={p.onUndo}
          onDismiss={p.onDismissUndo}
        />
      )}
    </div>
  );
}
