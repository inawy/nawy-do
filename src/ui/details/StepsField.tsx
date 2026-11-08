import { useState } from 'react';
import { useI18n } from '../i18n';
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
  const { t, num } = useI18n();
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
      <legend>{t('steps.title')}</legend>
      <ul className="list" aria-label={t('steps.title')}>
        {steps.map((st) => {
          if (st.level === 1 && folded.has(parentOf.get(st.id) ?? '')) return null;
          const kids = st.level === 1 ? 0 : childCount(st.id);
          return (
            <li key={st.id} className="step" data-level={st.level}>
              {kids > 0 && (
                <IconButton
                  label={t(folded.has(st.id) ? 'steps.unfold' : 'steps.fold', { title: st.title })}
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
                      ? t('steps.lift', { title: st.title })
                      : t('steps.nest', { title: st.title })
                  }
                  onClick={() =>
                    onChange(setStepLevel(steps, st.id, st.level === 1 ? undefined : 1))
                  }
                >
                  {st.level === 1 ? t('steps.liftShort') : t('steps.nestShort')}
                </Button>
              )}
              {([-1, 1] as const).map((delta) => {
                const moved = moveStep(steps, st.id, delta);
                return (
                  <IconButton
                    key={delta}
                    label={t(delta === -1 ? 'steps.earlier' : 'steps.later', { title: st.title })}
                    className={delta === -1 ? 'flip' : undefined}
                    disabled={moved === undefined}
                    onClick={() => moved && onChange(moved)}
                  >
                    <ChevronIcon />
                  </IconButton>
                );
              })}
              <IconButton
                label={t('steps.remove', { title: st.title })}
                onClick={() => onChange(steps.filter((x) => x.id !== st.id))}
              >
                <CloseIcon />
              </IconButton>
              {kids > 0 && folded.has(st.id) && <span className="step-count">{num(kids)}</span>}
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
          placeholder={t('steps.new')}
          aria-label={t('steps.new')}
          maxLength={MAX_STEP_TITLE}
          disabled={steps.length >= MAX_STEPS}
        />
        <Button onClick={onAdd} disabled={draft.trim() === ''}>
          {t('steps.add')}
        </Button>
      </div>
    </fieldset>
  );
}
