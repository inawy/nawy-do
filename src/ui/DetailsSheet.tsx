import { useEffect, useState } from 'react';
import { MAX_STEPS, MAX_STEP_TITLE, type Step, type Task, type TaskPatch } from '@/core/model';

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
  const [steps, setSteps] = useState<Step[]>(task.steps ?? []);
  const [newStep, setNewStep] = useState('');

  const addStep = () => {
    const title = newStep.trim();
    if (title === '' || steps.length >= MAX_STEPS) return;
    setSteps([...steps, { id: crypto.randomUUID(), title, done: false }]);
    setNewStep('');
  };

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
          // A step typed but not added yet is added on save, so it is never silently lost.
          const pending = newStep.trim();
          const all =
            pending !== '' && steps.length < MAX_STEPS
              ? [...steps, { id: crypto.randomUUID(), title: pending, done: false }]
              : steps;
          onSave({ title, notes, due, steps: all });
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
        <fieldset className="steps">
          <legend>الخطوات</legend>
          <ul className="list" aria-label="الخطوات">
            {steps.map((st) => (
              <li key={st.id} className="step">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() =>
                      setSteps(steps.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)))
                    }
                  />
                  <span className={st.done ? 'title done-title' : 'title'}>{st.title}</span>
                </label>
                <button
                  type="button"
                  className="icon"
                  aria-label={`حذف الخطوة: ${st.title}`}
                  onClick={() => setSteps(steps.filter((x) => x.id !== st.id))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="add-step">
            <input
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addStep();
                }
              }}
              placeholder="خطوة جديدة"
              aria-label="خطوة جديدة"
              maxLength={MAX_STEP_TITLE}
              disabled={steps.length >= MAX_STEPS}
            />
            <button type="button" onClick={addStep} disabled={newStep.trim() === ''}>
              أضف خطوة
            </button>
          </div>
        </fieldset>
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
