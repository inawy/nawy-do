import { useEffect, useState } from 'react';
import type { Task, TaskPatch } from '@/core/model';

interface Props {
  task: Task;
  onSave: (patch: TaskPatch) => void;
  onClose: () => void;
}

/** Edit sheet. Saving an empty title keeps the old one; clearing the date or notes removes them. */
export function DetailsSheet({ task, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [due, setDue] = useState(task.due ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل النية"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, notes, due });
          onClose();
        }}
      >
        <label>
          النية
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={1000}
            autoFocus
          />
        </label>
        <label>
          ملاحظات
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={20000}
          />
        </label>
        <label>
          تاريخ الاستحقاق
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <div className="actions">
          <button type="button" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="primary">
            حفظ
          </button>
        </div>
      </form>
    </div>
  );
}
