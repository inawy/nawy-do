import { useEffect, useState } from 'react';
import {
  listOf,
  MAX_STEPS,
  MAX_STEP_TITLE,
  type Step,
  type Task,
  type TaskList,
  type TaskPatch,
} from '@/core/model';
import { CloseIcon, StarIcon, TrashIcon } from '../primitives';

interface Props {
  task: Task;
  lists: TaskList[];
  onSave: (patch: TaskPatch) => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Details of one intention: a bottom sheet on phones, a centred card on wide screens. Saving an
 * empty title keeps the old one; clearing the date or notes removes them.
 */
export function DetailsSheet({ task, lists, onSave, onRemove, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [due, setDue] = useState(task.due ?? '');
  const [starred, setStarred] = useState(task.starred);
  const [steps, setSteps] = useState<Step[]>(task.steps ?? []);
  const [newStep, setNewStep] = useState('');
  // A task whose list was deleted shows (and saves) as belonging to the main list.
  const [listId, setListId] = useState(listOf(task, lists) ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addStep = () => {
    const text = newStep.trim();
    if (text === '' || steps.length >= MAX_STEPS) return;
    setSteps([...steps, { id: crypto.randomUUID(), title: text, done: false }]);
    setNewStep('');
  };

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
          onSave({ title, notes, due, steps: all, starred, listId });
          onClose();
        }}
      >
        <div className="sheet-head">
          <button type="button" className="icon" aria-label="إغلاق" onClick={onClose}>
            <CloseIcon />
          </button>
          <button
            type="button"
            className={starred ? 'star on' : 'star'}
            aria-label="مميزة"
            aria-pressed={starred}
            onClick={() => setStarred(!starred)}
          >
            <StarIcon on={starred} />
          </button>
        </div>

        <input
          className="sheet-title"
          aria-label="النية"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={1000}
          autoFocus
        />

        <label className="field">
          <span>ملاحظات</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={20000}
          />
        </label>

        {lists.length > 0 && (
          <label className="field">
            <span>القائمة</span>
            <select aria-label="القائمة" value={listId} onChange={(e) => setListId(e.target.value)}>
              <option value="">نواياي</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field">
          <span>تاريخ الاستحقاق</span>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>

        <fieldset className="steps">
          <legend>الخطوات</legend>
          <ul className="list" aria-label="الخطوات">
            {steps.map((st) => (
              <li key={st.id} className="step">
                <label className="hit">
                  <input
                    type="checkbox"
                    className="circle small"
                    aria-label={st.title}
                    checked={st.done}
                    onChange={() =>
                      setSteps(steps.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)))
                    }
                  />
                </label>
                <span className={st.done ? 'step-title done-title' : 'step-title'}>{st.title}</span>
                <button
                  type="button"
                  className="icon"
                  aria-label={`حذف الخطوة: ${st.title}`}
                  onClick={() => setSteps(steps.filter((x) => x.id !== st.id))}
                >
                  <CloseIcon />
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

        <div className="actions">
          <button type="button" className="danger" onClick={onRemove}>
            <TrashIcon />
            حذف النية
          </button>
          <span className="spacer" />
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
