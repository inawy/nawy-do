import { dueState, formatDue, stepProgress, type Task } from '@/core/model';

interface Props {
  task: Task;
  today: string;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
  onRemove: (task: Task) => void;
}

export function TaskRow({ task, today, onToggle, onOpen, onRemove }: Props) {
  const done = task.status === 'done';
  const progress = stepProgress(task);
  const state = task.due ? dueState(task.due, today) : undefined;
  return (
    <li className={done ? 'row done' : 'row'}>
      <label className="check">
        <input type="checkbox" checked={done} onChange={() => onToggle(task)} />
        <span className="text">
          <span className="title">{task.title}</span>
          {(task.due || task.notes || progress) && (
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
              {task.notes && <span className="chip">ملاحظات</span>}
            </span>
          )}
        </span>
      </label>
      <button
        type="button"
        className="icon"
        aria-label={`تفاصيل: ${task.title}`}
        onClick={() => onOpen(task)}
      >
        ✎
      </button>
      <button
        type="button"
        className="icon"
        aria-label={`حذف: ${task.title}`}
        onClick={() => onRemove(task)}
      >
        ✕
      </button>
    </li>
  );
}
