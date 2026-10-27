import { groupTasks, type Task } from '@/core/model';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onRemove: (task: Task) => void;
}

export function TaskList({ tasks, onToggle, onRemove }: Props) {
  const { open, done } = groupTasks(tasks);
  return (
    <>
      {open.length === 0 && done.length === 0 ? (
        <p className="empty">مفيش نوايا لسه. اكتب أول نية فوق.</p>
      ) : (
        <ul className="list" aria-label="النوايا">
          {open.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <details className="done-section">
          <summary>المنجزة ({done.length})</summary>
          <ul className="list" aria-label="المنجزة">
            {done.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={onToggle} onRemove={onRemove} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
