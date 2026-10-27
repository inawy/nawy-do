import type { Task } from '@/core/model';

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onRemove: (task: Task) => void;
}

export function TaskRow({ task, onToggle, onRemove }: Props) {
  const done = task.status === 'done';
  return (
    <li className={done ? 'row done' : 'row'}>
      <label className="check">
        <input type="checkbox" checked={done} onChange={() => onToggle(task)} />
        <span className="title">{task.title}</span>
      </label>
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
