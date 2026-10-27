import { useMemo, useState } from 'react';
import { useTasks } from '@/features/useTasks';
import type { NawyDoDb } from '@/data';
import { Composer } from '@/ui/Composer';
import { DetailsSheet } from '@/ui/DetailsSheet';
import { TaskList } from '@/ui/TaskList';
import { UndoToast } from '@/ui/UndoToast';
import { ViewTabs, type View } from '@/ui/ViewTabs';
import '@/ui/styles.css';
import { systemClock, systemToday } from './clock';
import { getDb } from './db';

interface Props {
  db?: NawyDoDb;
  now?: () => number;
  today?: () => string;
}

export function App({ db, now = systemClock, today = systemToday }: Props) {
  const database = useMemo(() => db ?? getDb(), [db]);
  const api = useTasks(database, now);
  const [view, setView] = useState<View>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  // The sheet shows the task as it is now; if it was deleted elsewhere it simply closes.
  const editing = api.tasks.find((t) => t.id === openId);

  return (
    <main className="app">
      <h1>ناوي دو</h1>
      <Composer onAdd={(title) => void api.add(title)} />
      <ViewTabs view={view} onChange={setView} />
      {api.failed ? (
        <p className="status" role="alert">
          مش قادر أفتح التخزين على الجهاز. لو فاتح تصفح خاص جرّب نافذة عادية.
        </p>
      ) : !api.ready ? (
        <p className="status">جاري التحميل…</p>
      ) : (
        <TaskList
          tasks={api.tasks}
          today={today()}
          view={view}
          onToggle={(t) => void api.toggle(t)}
          onOpen={(t) => setOpenId(t.id)}
          onRemove={(t) => void api.remove(t)}
        />
      )}
      {editing && (
        <DetailsSheet
          key={editing.id}
          task={editing}
          onSave={(patch) => void api.edit(editing, patch)}
          onClose={() => setOpenId(null)}
        />
      )}
      {api.lastRemoved && (
        <UndoToast
          title={api.lastRemoved.title}
          onUndo={() => void api.undoRemove()}
          onDismiss={api.dismissUndo}
        />
      )}
    </main>
  );
}
