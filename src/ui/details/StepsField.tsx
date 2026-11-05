import { useState } from 'react';
import {
  canIndent,
  MAX_STEPS,
  MAX_STEP_TITLE,
  moveStep,
  setStepLevel,
  type Step,
} from '@/core/model';
import { Button, ChevronIcon, CloseIcon, IconButton, TextInput } from '../primitives';

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
  // Parents whose nested steps are folded away (a view detail: never saved).
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const toggleFold = (id: string) =>
    setFolded((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  // The top-level step each nested step hangs under.
  const parentOf = new Map<string, string>();
  let parent = '';
  for (const s of steps) {
    if (s.level === 1) parentOf.set(s.id, parent);
    else parent = s.id;
  }
  const childCount = (id: string) => steps.filter((s) => parentOf.get(s.id) === id).length;
  return (
    <fieldset className="steps">
      <legend>الخطوات</legend>
      <ul className="list" aria-label="الخطوات">
        {steps.map((st) => {
          if (st.level === 1 && folded.has(parentOf.get(st.id) ?? '')) return null;
          const kids = st.level === 1 ? 0 : childCount(st.id);
          return (
            <li key={st.id} className="step" data-level={st.level}>
              {kids > 0 && (
                <IconButton
                  label={`${folded.has(st.id) ? 'افتح' : 'اطوِ'} الخطوات الفرعية: ${st.title}`}
                  aria-expanded={!folded.has(st.id)}
                  className={folded.has(st.id) ? undefined : 'flip'}
                  onClick={() => toggleFold(st.id)}
                >
                  <ChevronIcon />
                </IconButton>
              )}
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
              {(st.level === 1 || canIndent(steps, st.id)) && (
                <Button
                  variant="text"
                  aria-label={
                    st.level === 1
                      ? `ارفع الخطوة للمستوى الأول: ${st.title}`
                      : `اجعل الخطوة فرعية: ${st.title}`
                  }
                  onClick={() =>
                    onChange(setStepLevel(steps, st.id, st.level === 1 ? undefined : 1))
                  }
                >
                  {st.level === 1 ? 'رفع' : 'فرعية'}
                </Button>
              )}
              {([-1, 1] as const).map((delta) => {
                const moved = moveStep(steps, st.id, delta);
                return (
                  <IconButton
                    key={delta}
                    label={`${delta === -1 ? 'قدّم' : 'أخّر'} الخطوة: ${st.title}`}
                    className={delta === -1 ? 'flip' : undefined}
                    disabled={moved === undefined}
                    onClick={() => moved && onChange(moved)}
                  >
                    <ChevronIcon />
                  </IconButton>
                );
              })}
              <IconButton
                label={`حذف الخطوة: ${st.title}`}
                onClick={() => onChange(steps.filter((x) => x.id !== st.id))}
              >
                <CloseIcon />
              </IconButton>
              {kids > 0 && folded.has(st.id) && (
                <span className="step-count">{kids.toLocaleString('ar-EG')}</span>
              )}
            </li>
          );
        })}
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
