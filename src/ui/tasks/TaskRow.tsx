import { dueState, formatDue, stepProgress, type Task } from '@/core/model';
import { GripIcon, StarIcon } from '../primitives';
import type { SortState } from '../sortable';

interface Props {
  task: Task;
  today: string;
  onToggle: (task: Task) => void;
  onStar: (task: Task) => void;
  onOpen: (task: Task) => void;
  /** Present only when the row can be re-ordered. */
  sort?: SortState;
}

/** One intention: circle to complete, the text opens the details, the star marks it. */
export function TaskRow({ task, today, onToggle, onStar, onOpen, sort }: Props) {
  const done = task.status === 'done';
  const state = task.due ? dueState(task.due, today) : undefined;
  const progress = stepProgress(task);
  const hasMeta = Boolean(task.due) || progress !== undefined;
  return (
    <li
      ref={sort?.rowRef}
      style={sort?.style}
      className={['row', done && 'done', sort?.dragging && 'dragging'].filter(Boolean).join(' ')}
    >
      <label className="hit">
        <input
          type="checkbox"
          className="circle"
          checked={done}
          onChange={() => onToggle(task)}
          aria-label={`${done ? 'إلغاء إنجاز' : 'إنجاز'}: ${task.title}`}
        />
      </label>
      <button
        type="button"
        className="body"
        aria-label={`تفاصيل: ${task.title}`}
        onClick={() => onOpen(task)}
      >
        <span className="title">{task.title}</span>
        {task.notes && <span className="snippet">{task.notes}</span>}
        {hasMeta && (
          <span className="meta">
            {task.due && (
              <span className={done ? 'chip' : `chip ${state ?? ''}`}>
                {formatDue(task.due, today)}
              </span>
            )}
            {progress && (
              <span className="chip">
                خطوات {progress.done}/{progress.total}
              </span>
            )}
          </span>
        )}
      </button>
      <button
        type="button"
        className={task.starred ? 'star on' : 'star'}
        aria-label={`تمييز: ${task.title}`}
        aria-pressed={task.starred}
        onClick={() => onStar(task)}
      >
        <StarIcon on={task.starred} />
      </button>
      {sort && (
        <button
          type="button"
          className="grip"
          aria-label={`تحريك: ${task.title}`}
          {...sort.handle}
        >
          <GripIcon />
        </button>
      )}
    </li>
  );
}
