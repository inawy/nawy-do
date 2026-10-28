import { groupScheduled, groupTasks, type Task, type ViewId } from '@/core/model';
import { ChevronIcon } from '../primitives';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  today: string;
  view: ViewId;
  onToggle: (task: Task) => void;
  onStar: (task: Task) => void;
  onOpen: (task: Task) => void;
}

const EMPTY: Record<ViewId, string> = {
  all: 'مفيش نوايا لسه. اكتب أول نية فوق.',
  starred: 'مفيش نوايا مميزة. دوس على النجمة جنب أي نية.',
  scheduled: 'مفيش نوايا بتاريخ. افتح نية وحدد لها يوم.',
};

export function TaskList({ tasks, today, view, onToggle, onStar, onOpen }: Props) {
  const rows = (list: Task[], label: string) => (
    <ul className="list" aria-label={label}>
      {list.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          today={today}
          onToggle={onToggle}
          onStar={onStar}
          onOpen={onOpen}
        />
      ))}
    </ul>
  );

  if (view === 'scheduled') {
    const g = groupScheduled(tasks, today);
    if (g.overdue.length + g.today.length + g.upcoming.length === 0) {
      return <Empty text={EMPTY.scheduled} />;
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

  const shown = view === 'starred' ? tasks.filter((t) => t.starred) : tasks;
  const { open, done } = groupTasks(shown);
  return (
    <>
      {open.length === 0 && done.length === 0 ? (
        <Empty text={EMPTY[view]} />
      ) : (
        open.length > 0 && rows(open, 'النوايا')
      )}
      {done.length > 0 && (
        <details className="done-section">
          <summary>
            <span className="chev">
              <ChevronIcon />
            </span>
            المنجزة ({done.length})
          </summary>
          {rows(done, 'المنجزة')}
        </details>
      )}
    </>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true" focusable="false">
        <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="4" />
        <path
          d="M30 49l12 12 24-26"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p>{text}</p>
    </div>
  );
}
