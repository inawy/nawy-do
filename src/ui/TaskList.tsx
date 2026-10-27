import { groupScheduled, groupTasks, type Task } from '@/core/model';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  today: string;
  view: 'all' | 'scheduled';
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
  onRemove: (task: Task) => void;
}

export function TaskList({ tasks, today, view, onToggle, onOpen, onRemove }: Props) {
  const rows = (list: Task[], label: string) => (
    <ul className="list" aria-label={label}>
      {list.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          today={today}
          onToggle={onToggle}
          onOpen={onOpen}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );

  if (view === 'scheduled') {
    const g = groupScheduled(tasks, today);
    if (g.overdue.length + g.today.length + g.upcoming.length === 0) {
      return <p className="empty">مفيش نوايا بتاريخ. افتح نية وحدد لها يوم.</p>;
    }
    return (
      <>
        {g.overdue.length > 0 && (
          <section>
            <h2>متأخرة</h2>
            {rows(g.overdue, 'متأخرة')}
          </section>
        )}
        {g.today.length > 0 && (
          <section>
            <h2>النهارده</h2>
            {rows(g.today, 'النهارده')}
          </section>
        )}
        {g.upcoming.length > 0 && (
          <section>
            <h2>قادمة</h2>
            {rows(g.upcoming, 'قادمة')}
          </section>
        )}
      </>
    );
  }

  const { open, done } = groupTasks(tasks);
  return (
    <>
      {open.length === 0 && done.length === 0 ? (
        <p className="empty">مفيش نوايا لسه. اكتب أول نية فوق.</p>
      ) : (
        rows(open, 'النوايا')
      )}
      {done.length > 0 && (
        <details className="done-section">
          <summary>المنجزة ({done.length})</summary>
          {rows(done, 'المنجزة')}
        </details>
      )}
    </>
  );
}
