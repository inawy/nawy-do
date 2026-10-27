import { useMemo } from 'react';
import { useTasks } from '@/features/useTasks';
import type { NawyDoDb } from '@/data';
import { Composer } from '@/ui/Composer';
import { TaskList } from '@/ui/TaskList';
import { UndoToast } from '@/ui/UndoToast';
import '@/ui/styles.css';
import { systemClock } from './clock';
import { getDb } from './db';

export function App({ db, now = systemClock }: { db?: NawyDoDb; now?: () => number }) {
  const database = useMemo(() => db ?? getDb(), [db]);
  const api = useTasks(database, now);
  return (
    <main className="app">
      <h1>ناوي دو</h1>
      <Composer onAdd={(title) => void api.add(title)} />
      {api.failed ? (
        <p className="status" role="alert">
          مش قادر أفتح التخزين على الجهاز. لو فاتح تصفح خاص جرّب نافذة عادية.
        </p>
      ) : !api.ready ? (
        <p className="status">جاري التحميل…</p>
      ) : (
        <TaskList
          tasks={api.tasks}
          onToggle={(t) => void api.toggle(t)}
          onRemove={(t) => void api.remove(t)}
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
