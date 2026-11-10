import { dueState, stepProgress, type Task } from '@/core/model';
import { formatDue, formatTime } from '../i18n/format';
import { useI18n } from '../i18n';
import { GripIcon, StarIcon } from '../primitives';
import type { SortState } from '../sortable';
import { useLongPress } from './useLongPress';

interface Props {
  task: Task;
  today: string;
  onToggle: (task: Task) => void;
  onStar: (task: Task) => void;
  onOpen: (task: Task) => void;
  /** Long press starts selection with this task picked. */
  onLongPress?: (task: Task) => void;
  /** Present only when the row can be re-ordered. */
  sort?: SortState;
  /** Selection mode: the row is picked instead of completed, starred or opened. */
  pick?: { on: boolean; onToggle: () => void };
}

/** One intention: circle to complete, the text opens the details, the star marks it. */
export function TaskRow({ task, today, onToggle, onStar, onOpen, onLongPress, sort, pick }: Props) {
  const i18n = useI18n();
  const { t } = i18n;
  const done = task.status === 'done';
  const state = task.due ? dueState(task.due, today) : undefined;
  const progress = stepProgress(task);
  const hasMeta = Boolean(task.due) || progress !== undefined;
  const repeatText = task.repeat ? t(`repeat.${task.repeat}`) : undefined;
  const press = useLongPress(onLongPress && !pick ? () => onLongPress(task) : undefined);
  return (
    <li
      ref={sort?.rowRef}
      style={sort?.style}
      className={['row', done && 'done', sort?.dragging && 'dragging'].filter(Boolean).join(' ')}
    >
      <div className="row-slide" {...press}>
        {pick ? (
          <label className="hit">
            <input
              type="checkbox"
              className="circle pick"
              checked={pick.on}
              onChange={pick.onToggle}
              aria-label={t('row.select', { title: task.title })}
            />
          </label>
        ) : (
          <label className="hit">
            <input
              type="checkbox"
              className="circle"
              checked={done}
              onChange={() => onToggle(task)}
              aria-label={t(done ? 'row.reopen' : 'row.complete', { title: task.title })}
            />
          </label>
        )}
        <button
          type="button"
          className="body"
          aria-label={t('row.details', { title: task.title })}
          onClick={() => (pick ? pick.onToggle() : onOpen(task))}
        >
          <span className="title">{task.title}</span>
          {task.notes && <span className="snippet">{task.notes}</span>}
          {hasMeta && (
            <span className="meta">
              {task.due && (
                <span className={done ? 'chip' : `chip ${state ?? ''}`}>
                  {formatDue(task.due, today, i18n)}
                  {task.dueTime && ` · ${formatTime(task.dueTime, i18n)}`}
                </span>
              )}
              {repeatText && !done && <span className="chip">{repeatText}</span>}
              {progress && (
                <span className="chip">
                  {t('row.steps', { done: progress.done, total: progress.total })}
                </span>
              )}
            </span>
          )}
        </button>
        {!pick && (
          <button
            type="button"
            className={task.starred ? 'star on' : 'star'}
            aria-label={t('row.star', { title: task.title })}
            aria-pressed={task.starred}
            onClick={() => onStar(task)}
          >
            <StarIcon on={task.starred} />
          </button>
        )}
        {sort && !pick && (
          <button
            type="button"
            className="grip"
            data-no-press
            aria-label={t('row.move', { title: task.title })}
            {...sort.handle}
          >
            <GripIcon />
          </button>
        )}
      </div>
    </li>
  );
}
