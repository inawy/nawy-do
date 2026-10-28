import type { Task, TaskPatch, ViewId } from '@/core/model';
import { viewCounts } from '@/core/model';
import { DetailsSheet } from '../details';
import { Composer, TaskList, UndoToast } from '../tasks';
import '../styles/index.css';
import { Nav } from './Nav';

const TITLES: Record<ViewId, string> = {
  all: 'نواياي',
  starred: 'المفضلة',
  scheduled: 'مجدولة',
};

export interface TasksScreenProps {
  tasks: Task[];
  today: string;
  view: ViewId;
  ready: boolean;
  failed: boolean;
  editing: Task | undefined;
  lastRemoved: Task | null;
  /** Set when a new app version is waiting. */
  applyUpdate: (() => void) | undefined;
  onView: (v: ViewId) => void;
  onAdd: (title: string) => void;
  onToggle: (t: Task) => void;
  onStar: (t: Task) => void;
  onOpen: (t: Task) => void;
  onMove: (id: string, toIndex: number) => void;
  onClose: () => void;
  onSave: (t: Task, patch: TaskPatch) => void;
  onRemove: (t: Task) => void;
  onUndo: () => void;
  onDismissUndo: () => void;
}

/** The whole screen as a function of its props: easy to test and to preview without a database. */
export function TasksScreen(p: TasksScreenProps) {
  const counts = viewCounts(p.tasks);
  const { editing } = p;
  return (
    <div className="shell">
      <header className="side-head">
        <p className="brand">ناوي دو</p>
      </header>
      <Nav view={p.view} counts={counts} onChange={p.onView} />
      <main className="main">
        {p.applyUpdate && (
          <div className="update" role="status">
            <span>في نسخة جديدة من ناوي دو.</span>
            <button type="button" onClick={p.applyUpdate}>
              حدّث
            </button>
          </div>
        )}
        <h1>{TITLES[p.view]}</h1>
        <Composer onAdd={p.onAdd} />
        {p.failed ? (
          <p className="status" role="alert">
            مش قادر أفتح التخزين على الجهاز. لو فاتح تصفح خاص جرّب نافذة عادية.
          </p>
        ) : !p.ready ? (
          <p className="status">جاري التحميل…</p>
        ) : (
          <TaskList
            tasks={p.tasks}
            today={p.today}
            view={p.view}
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
          onSave={(patch) => p.onSave(editing, patch)}
          onRemove={() => {
            p.onRemove(editing);
            p.onClose();
          }}
          onClose={p.onClose}
        />
      )}
      {p.lastRemoved && (
        <UndoToast title={p.lastRemoved.title} onUndo={p.onUndo} onDismiss={p.onDismissUndo} />
      )}
    </div>
  );
}
