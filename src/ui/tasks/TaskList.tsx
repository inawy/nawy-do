import {
  groupScheduled,
  groupTasks,
  selectedListId,
  type Selection,
  type Task,
} from '@/core/model';
import { ChevronIcon } from '../primitives';
import { SortableItem, SortableList, type SortState } from '../sortable';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  today: string;
  view: Selection;
  onToggle: (task: Task) => void;
  onStar: (task: Task) => void;
  onOpen: (task: Task) => void;
  onMove: (id: string, toIndex: number) => void;
}

const EMPTY = {
  main: 'مفيش نوايا لسه. اكتب أول نية فوق.',
  list: 'القائمة فاضية. اكتب أول نية فيها فوق.',
  starred: 'مفيش نوايا مميزة. دوس على النجمة جنب أي نية.',
  scheduled: 'مفيش نوايا بتاريخ. افتح نية وحدد لها يوم.',
} as const;

export function TaskList({ tasks, today, view, onToggle, onStar, onOpen, onMove }: Props) {
  const grouped = groupTasks(view === 'starred' ? tasks.filter((t) => t.starred) : tasks);
  // Only the main list and a single list can be re-ordered: each shows all of its open tasks, so a
  // move is unambiguous. The favourites and scheduled views are filtered or sorted by date.
  const canSort =
    (view === 'main' || selectedListId(view) !== undefined) && grouped.open.length > 1;

  const row = (t: Task, sort?: SortState) => (
    <TaskRow
      key={t.id}
      task={t}
      today={today}
      onToggle={onToggle}
      onStar={onStar}
      onOpen={onOpen}
      sort={sort}
    />
  );

  const rows = (list: Task[], label: string) => (
    <ul className="list" aria-label={label}>
      {list.map((t) => row(t))}
    </ul>
  );

  const sortableRows = (list: Task[], label: string) => {
    const byId = new Map(list.map((t) => [t.id, t]));
    return (
      <SortableList
        ids={list.map((t) => t.id)}
        ariaLabel={label}
        describe={(id) => byId.get(id)?.title ?? ''}
        onMove={onMove}
      >
        {(ordered) =>
          ordered.map((id) => {
            const t = byId.get(id);
            return t ? (
              <SortableItem key={id} id={id}>
                {(sort) => row(t, sort)}
              </SortableItem>
            ) : null;
          })
        }
      </SortableList>
    );
  };

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

  const { open, done } = grouped;
  return (
    <>
      {open.length === 0 && done.length === 0 ? (
        <Empty
          text={EMPTY[selectedListId(view) !== undefined ? 'list' : (view as 'main' | 'starred')]}
        />
      ) : (
        open.length > 0 && (canSort ? sortableRows(open, 'النوايا') : rows(open, 'النوايا'))
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
