import type { ReactNode } from 'react';
import {
  canReorder,
  groupScheduled,
  groupTasks,
  isSortable,
  sortOpen,
  type SortMode,
  selectedListId,
  type Selection,
  type Task,
} from '@/core/model';
import { useI18n } from '../i18n';
import { ChevronIcon } from '../primitives';
import { SortableItem, SortableList, type SortState } from '../sortable';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  today: string;
  view: Selection | 'search';
  onToggle: (task: Task) => void;
  onStar: (task: Task) => void;
  onOpen: (task: Task) => void;
  sort: SortMode;
  onLongPress?: (task: Task) => void;
  onMove: (id: string, toIndex: number, shown: readonly string[]) => void;
  /** Dropping a row on a list in the navigation: the task id and the target (`main` or a list id). */
  onDropOnList?: (id: string, target: string) => void;
  /** Selection mode when present. */
  picked?: ReadonlySet<string>;
  onPick?: (id: string) => void;
  /** The title bar (and search field): drawn at the top of the first card. */
  header?: ReactNode;
}

export function TaskList({
  tasks,
  today,
  view,
  onToggle,
  onStar,
  onOpen,
  sort,
  onLongPress,
  onMove,
  onDropOnList,
  picked,
  onPick,
  header,
}: Props) {
  const { t, num } = useI18n();
  const grouped = groupTasks(view === 'starred' ? tasks.filter((t) => t.starred) : tasks);
  const openSorted = isSortable(view) ? sortOpen(grouped.open, sort) : grouped.open;
  const canSort = !picked && canReorder(view, grouped.open.length, sort);

  const card = (children: ReactNode) => (
    <div className="card">
      {header}
      {children}
    </div>
  );

  const row = (t: Task, sort?: SortState) => (
    <TaskRow
      key={t.id}
      task={t}
      today={today}
      onToggle={onToggle}
      onStar={onStar}
      onOpen={onOpen}
      onLongPress={onLongPress}
      sort={sort}
      pick={picked && onPick ? { on: picked.has(t.id), onToggle: () => onPick(t.id) } : undefined}
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
        onMove={(id, to) =>
          onMove(
            id,
            to,
            list.map((t) => t.id),
          )
        }
        onDropOnList={onDropOnList}
        currentTarget={selectedListId(view) ?? 'main'}
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

  if (view === 'scheduled' || view === 'today') {
    const g = groupScheduled(tasks, today);
    if (g.overdue.length + g.today.length + g.upcoming.length === 0) {
      return card(<Empty text={t(`empty.${view}`)} />);
    }
    return card(
      <>
        {g.overdue.length > 0 && (
          <section>
            <h2>{t('group.overdue')}</h2>
            {rows(g.overdue, t('group.overdue'))}
          </section>
        )}
        {g.today.length > 0 && (
          <section>
            <h2>{t('group.today')}</h2>
            {rows(g.today, t('group.today'))}
          </section>
        )}
        {g.upcoming.length > 0 && (
          <section>
            <h2>{t('group.upcoming')}</h2>
            {rows(g.upcoming, t('group.upcoming'))}
          </section>
        )}
      </>,
    );
  }

  const { done } = grouped;
  const open = openSorted;
  return (
    <>
      {card(
        open.length === 0 && done.length === 0 ? (
          <Empty
            text={t(
              `empty.${selectedListId(view) !== undefined ? 'list' : (view as 'main' | 'starred' | 'search')}`,
            )}
          />
        ) : open.length > 0 ? (
          canSort ? (
            sortableRows(open, t('group.tasks'))
          ) : (
            rows(open, t('group.tasks'))
          )
        ) : null,
      )}
      {done.length > 0 && (
        <details className="done-section">
          <summary>
            <span className="chev">
              <ChevronIcon />
            </span>
            {t('group.doneCount', { count: num(done.length) })}
          </summary>
          {rows(done, t('group.done'))}
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
