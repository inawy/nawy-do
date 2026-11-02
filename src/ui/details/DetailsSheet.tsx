import { useState } from 'react';
import {
  listOf,
  MAX_STEPS,
  MAX_STEP_TITLE,
  quickDueOptions,
  type Step,
  type Task,
  type TaskList,
  type TaskPatch,
} from '@/core/model';
import {
  Button,
  Chip,
  CloseIcon,
  Field,
  IconButton,
  Select,
  StarIcon,
  TextArea,
  TextInput,
  TrashIcon,
} from '../primitives';
import { Sheet } from '../sheet';

interface Props {
  task: Task;
  lists: TaskList[];
  today: string;
  onSave: (patch: TaskPatch) => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Details of one intention: a bottom sheet on phones, a centred card on wide screens. Saving an
 * empty title keeps the old one; clearing the date or notes removes them.
 */
export function DetailsSheet({ task, lists, today, onSave, onRemove, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [due, setDue] = useState(task.due ?? '');
  const [starred, setStarred] = useState(task.starred);
  const [steps, setSteps] = useState<Step[]>(task.steps ?? []);
  const [newStep, setNewStep] = useState('');
  // A task whose list was deleted shows (and saves) as belonging to the main list.
  const [listId, setListId] = useState(listOf(task, lists) ?? '');

  const addStep = () => {
    const text = newStep.trim();
    if (text === '' || steps.length >= MAX_STEPS) return;
    setSteps([...steps, { id: crypto.randomUUID(), title: text, done: false }]);
    setNewStep('');
  };

  return (
    <Sheet
      label="تفاصيل النية"
      onClose={onClose}
      onSubmit={() => {
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
        <IconButton label="إغلاق" onClick={onClose}>
          <CloseIcon />
        </IconButton>
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

      <Field label="ملاحظات">
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={20000}
        />
      </Field>

      {lists.length > 0 && (
        <Field label="القائمة">
          <Select aria-label="القائمة" value={listId} onChange={(e) => setListId(e.target.value)}>
            <option value="">نواياي</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="تاريخ الاستحقاق">
        <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <span className="chips" role="group" aria-label="اختيارات سريعة للتاريخ">
          {quickDueOptions(today).map((o) => (
            <Chip key={o.value} pressed={due === o.value} onClick={() => setDue(o.value)}>
              {o.label}
            </Chip>
          ))}
          <Chip disabled={due === ''} onClick={() => setDue('')}>
            بدون تاريخ
          </Chip>
        </span>
      </Field>

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
              <IconButton
                label={`حذف الخطوة: ${st.title}`}
                onClick={() => setSteps(steps.filter((x) => x.id !== st.id))}
              >
                <CloseIcon />
              </IconButton>
            </li>
          ))}
        </ul>
        <div className="add-step">
          <TextInput
            className="min-w-0 flex-1"
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
          <Button onClick={addStep} disabled={newStep.trim() === ''}>
            أضف خطوة
          </Button>
        </div>
      </fieldset>

      <div className="actions">
        <Button variant="danger" onClick={onRemove}>
          <TrashIcon />
          حذف النية
        </Button>
        <span className="spacer" />
        <Button onClick={onClose}>إلغاء</Button>
        <Button type="submit" variant="primary">
          حفظ
        </Button>
      </div>
    </Sheet>
  );
}
