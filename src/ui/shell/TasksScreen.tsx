import { useState } from 'react';
import {
  countsFor,
  listSelection,
  selectedListId,
  tasksIn,
  type Selection,
  type Task,
  type TaskList,
  type TaskPatch,
} from '@/core/model';
import { DetailsSheet } from '../details';
import { ListSheet } from '../lists';
import { MoreIcon } from '../primitives';
import { Composer, TaskList as Tasks, UndoToast } from '../tasks';
import '../styles/index.css';
import { Nav } from './Nav';

const TITLES = { main: 'نواياي', starred: 'المفضلة', scheduled: 'مجدولة' } as const;

const LIST_ERRORS = {
  limit: 'وصلت للحد الأقصى من القوائم.',
  failed: 'مقدرتش أحفظ القائمة. جرّب تاني.',
} as const;

export interface TasksScreenProps {
  tasks: Task[];
  lists: TaskList[];
  today: string;
  selection: Selection;
  ready: boolean;
  failed: boolean;
  editing: Task | undefined;
  /** The task or list just deleted (at most one is offered for undo). */
  removed: { kind: 'task' | 'list'; label: string } | null;
  /** Set when a new app version is waiting. */
  applyUpdate: (() => void) | undefined;
  onSelect: (s: Selection) => void;
  onAdd: (title: string) => void;
  onToggle: (t: Task) => void;
  onStar: (t: Task) => void;
  onOpen: (t: Task) => void;
  onMove: (id: string, toIndex: number) => void;
  onClose: () => void;
  onSave: (t: Task, patch: TaskPatch) => void;
  onRemove: (t: Task) => void;
  onAddList: (name: string) => Promise<TaskList | 'empty' | 'limit' | 'failed'>;
  onRenameList: (list: TaskList, name: string) => void;
  onDeleteList: (list: TaskList) => void;
  onMoveList: (list: TaskList, delta: -1 | 1) => void;
  onUndo: () => void;
  onDismissUndo: () => void;
}

type Sheet = { mode: 'create' } | { mode: 'edit'; id: string } | null;

/** The whole screen as a function of its props: easy to test and to preview without a database. */
export function TasksScreen(p: TasksScreenProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sheetError, setSheetError] = useState<string | undefined>();

  // A list deleted elsewhere while it is open: fall back to the main list.
  const listId = selectedListId(p.selection);
  const list = listId === undefined ? undefined : p.lists.find((l) => l.id === listId);
  const selection: Selection = listId !== undefined && !list ? 'main' : p.selection;

  const counts = countsFor(p.tasks, p.lists);
  const visible = tasksIn(p.tasks, p.lists, selection);
  const title = list ? list.name : TITLES[selection as keyof typeof TITLES];
  const editingList = sheet?.mode === 'edit' ? p.lists.find((l) => l.id === sheet.id) : undefined;
  const { editing } = p;

  const closeSheet = () => {
    setSheet(null);
    setSheetError(undefined);
  };

  return (
    <div className="shell">
      <header className="side-head">
        <p className="brand">ناوي دو</p>
      </header>
      <Nav
        selection={selection}
        counts={counts}
        lists={p.lists}
        onSelect={p.onSelect}
        onNewList={() => setSheet({ mode: 'create' })}
      />
      <main className="main">
        {p.applyUpdate && (
          <div className="update" role="status">
            <span>في نسخة جديدة من ناوي دو.</span>
            <button type="button" onClick={p.applyUpdate}>
              حدّث
            </button>
          </div>
        )}
        <div className="title-row">
          <h1>{title}</h1>
          {list && (
            <button
              type="button"
              className="icon"
              aria-label="خيارات القائمة"
              onClick={() => setSheet({ mode: 'edit', id: list.id })}
            >
              <MoreIcon />
            </button>
          )}
        </div>
        <Composer onAdd={p.onAdd} />
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
            view={selection}
            onToggle={p.onToggle}
            onStar={p.onStar}
            onOpen={p.onOpen}
            onMove={p.onMove}
          />
        )}
      </main>
      {editing && (
        <DetailsSheet
          key={editing.id}
          task={editing}
          lists={p.lists}
          onSave={(patch) => p.onSave(editing, patch)}
          onRemove={() => {
            p.onRemove(editing);
            p.onClose();
          }}
          onClose={p.onClose}
        />
      )}
      {sheet?.mode === 'create' && (
        <ListSheet
          mode="create"
          initialName=""
          error={sheetError}
          onClose={closeSheet}
          onSave={(name) => {
            void p.onAddList(name).then((result) => {
              if (typeof result === 'object') {
                p.onSelect(listSelection(result.id));
                closeSheet();
              } else if (result !== 'empty') {
                setSheetError(LIST_ERRORS[result]);
              }
            });
          }}
        />
      )}
      {editingList && (
        <ListSheet
          mode="edit"
          initialName={editingList.name}
          canMoveEarlier={p.lists.findIndex((l) => l.id === editingList.id) > 0}
          canMoveLater={p.lists.findIndex((l) => l.id === editingList.id) < p.lists.length - 1}
          onMove={(delta) => p.onMoveList(editingList, delta)}
          onClose={closeSheet}
          onSave={(name) => {
            p.onRenameList(editingList, name);
            closeSheet();
          }}
          onDelete={() => {
            p.onDeleteList(editingList);
            p.onSelect('main');
            closeSheet();
          }}
        />
      )}
      {p.removed && (
        <UndoToast
          message={
            p.removed.kind === 'list'
              ? `اتحذفت القائمة: ${p.removed.label}`
              : `اتحذفت: ${p.removed.label}`
          }
          onUndo={p.onUndo}
          onDismiss={p.onDismissUndo}
        />
      )}
    </div>
  );
}
