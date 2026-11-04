import { MAX_STEPS, MAX_STEP_TITLE, type Step } from '@/core/model';
import { Button, CloseIcon, IconButton, TextInput } from '../primitives';

interface Props {
  steps: Step[];
  onChange: (steps: Step[]) => void;
  /** The text typed for the next step, and what to do with it. */
  draft: string;
  onDraft: (text: string) => void;
  onAdd: () => void;
}

/** The checklist of a task: tick, remove, and add steps. */
export function StepsField({ steps, onChange, draft, onDraft, onAdd }: Props) {
  return (
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
                  onChange(steps.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)))
                }
              />
            </label>
            <span className={st.done ? 'step-title done-title' : 'step-title'}>{st.title}</span>
            <IconButton
              label={`حذف الخطوة: ${st.title}`}
              onClick={() => onChange(steps.filter((x) => x.id !== st.id))}
            >
              <CloseIcon />
            </IconButton>
          </li>
        ))}
      </ul>
      <div className="add-step">
        <TextInput
          className="min-w-0 flex-1"
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="خطوة جديدة"
          aria-label="خطوة جديدة"
          maxLength={MAX_STEP_TITLE}
          disabled={steps.length >= MAX_STEPS}
        />
        <Button onClick={onAdd} disabled={draft.trim() === ''}>
          أضف خطوة
        </Button>
      </div>
    </fieldset>
  );
}
