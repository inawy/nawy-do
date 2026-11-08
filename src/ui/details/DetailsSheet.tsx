import { useState } from 'react';
import {
  listOf,
  MAX_STEPS,
  quickDueOptions,
  REPEATS,
  type Repeat,
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
import { useT } from '../i18n';
import { Sheet } from '../sheet';
import { changedFields, formOf } from './formPatch';
import { StepsField } from './StepsField';

interface Props {
  task: Task;
  lists: TaskList[];
  today: string;
  onSave: (patch: TaskPatch) => void;
  newId: () => string;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Details of one intention: a bottom sheet on phones, a centred card on wide screens. Saving an
 * empty title keeps the old one; clearing the date or notes removes them.
 */
export function DetailsSheet({ task, lists, today, onSave, newId, onRemove, onClose }: Props) {
  const t = useT();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [due, setDue] = useState(task.due ?? '');
  const [dueTime, setDueTime] = useState(task.dueTime ?? '');
  const [repeat, setRepeat] = useState<Repeat | ''>(task.repeat ?? '');
  const [starred, setStarred] = useState(task.starred);
  const [steps, setSteps] = useState<Step[]>(task.steps ?? []);
  const [newStep, setNewStep] = useState('');
  // A task whose list was deleted shows as belonging to the main list, but keeps its listId
  // until the person picks another list (changedFields leaves it alone).
  const [listId, setListId] = useState(listOf(task, lists) ?? '');
  const [initial] = useState(() => formOf(task, lists));

  const addStep = () => {
    const text = newStep.trim();
    if (text === '' || steps.length >= MAX_STEPS) return;
    setSteps([...steps, { id: newId(), title: text, done: false }]);
    setNewStep('');
  };

  return (
    <Sheet
      label={t('details.title')}
      onClose={onClose}
      onSubmit={() => {
        // A step typed but not added yet is added on save, so it is never silently lost.
        const pending = newStep.trim();
        const all =
          pending !== '' && steps.length < MAX_STEPS
            ? [...steps, { id: newId(), title: pending, done: false }]
            : steps;
        const patch = changedFields(initial, {
          title,
          notes,
          due,
          dueTime,
          repeat,
          steps: all,
          starred,
          listId,
        });
        if (Object.keys(patch).length > 0) onSave(patch);
        onClose();
      }}
    >
      <div className="sheet-head">
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <button
          type="button"
          className={starred ? 'star on' : 'star'}
          aria-label={t('details.starred')}
          aria-pressed={starred}
          onClick={() => setStarred(!starred)}
        >
          <StarIcon on={starred} />
        </button>
      </div>

      <input
        className="sheet-title"
        aria-label={t('details.task')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={1000}
        autoFocus
      />

      <Field label={t('details.notes')}>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={20000}
        />
      </Field>

      {lists.length > 0 && (
        <Field label={t('details.list')}>
          <Select
            aria-label={t('details.list')}
            value={listId}
            onChange={(e) => setListId(e.target.value)}
          >
            <option value="">{t('view.main')}</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label={t('details.due')}>
        <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <span className="chips" role="group" aria-label={t('details.quickDue')}>
          {quickDueOptions(today).map((o) => (
            <Chip key={o.value} pressed={due === o.value} onClick={() => setDue(o.value)}>
              {t(`date.${o.key}`)}
            </Chip>
          ))}
          <Chip disabled={due === ''} onClick={() => setDue('')}>
            {t('details.noDate')}
          </Chip>
        </span>
      </Field>

      <div className="field-row">
        <Field label={t('details.time')}>
          <TextInput
            type="time"
            value={due === '' ? '' : dueTime}
            disabled={due === ''}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </Field>

        <Field label={t('details.repeat')}>
          <Select
            aria-label={t('details.repeat')}
            value={due === '' ? '' : repeat}
            disabled={due === ''}
            onChange={(e) => setRepeat(REPEATS.find((r) => r === e.target.value) ?? '')}
          >
            <option value="">{t('details.noRepeat')}</option>
            {REPEATS.map((r) => (
              <option key={r} value={r}>
                {t(`repeat.${r}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <StepsField
        steps={steps}
        onChange={setSteps}
        draft={newStep}
        onDraft={setNewStep}
        onAdd={addStep}
      />

      <div className="actions sticky-actions">
        <Button variant="danger" onClick={onRemove}>
          <TrashIcon />
          {t('details.delete')}
        </Button>
        <span className="spacer" />
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary">
          {t('common.save')}
        </Button>
      </div>
    </Sheet>
  );
}
