import { useMemo, useState, useSyncExternalStore } from 'react';
import type { ViewId } from '@/core/model';
import type { NawyDoDb } from '@/data';
import { useTasks } from '@/features/tasks';
import { TasksScreen } from '@/ui/shell';
import { systemClock, systemToday } from './clock';
import { getDb } from './db';
import { updateSignal } from './updateSignal';

interface Props {
  db?: NawyDoDb;
  now?: () => number;
  today?: () => string;
}

export function App({ db, now = systemClock, today = systemToday }: Props) {
  const database = useMemo(() => db ?? getDb(), [db]);
  const api = useTasks(database, now);
  const applyUpdate = useSyncExternalStore(updateSignal.subscribe, updateSignal.get);
  const [view, setView] = useState<ViewId>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  // The sheet shows the task as it is now; if it was deleted elsewhere it simply closes.
  const editing = api.tasks.find((t) => t.id === openId);

  return (
    <TasksScreen
      tasks={api.tasks}
      today={today()}
      view={view}
      ready={api.ready}
      failed={api.failed}
      editing={editing}
      lastRemoved={api.lastRemoved}
      applyUpdate={applyUpdate}
      onView={setView}
      onAdd={(title) => void api.add(title)}
      onToggle={(t) => void api.toggle(t)}
      onStar={(t) => void api.edit(t, { starred: !t.starred })}
      onOpen={(t) => setOpenId(t.id)}
      onMove={(id, to) => void api.move(id, to)}
      onClose={() => setOpenId(null)}
      onSave={(t, patch) => void api.edit(t, patch)}
      onRemove={(t) => void api.remove(t)}
      onUndo={() => void api.undoRemove()}
      onDismissUndo={api.dismissUndo}
    />
  );
}
