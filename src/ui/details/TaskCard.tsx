import { useState } from 'react';
import { listOf, type Task, type TaskList, type TaskPatch } from '@/core/model';
import { useI18n } from '../i18n';
import { formatDue, formatTime } from '../i18n/format';
import {
  CalendarIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  IconButton,
  ListIcon,
  ShareIcon,
  StarIcon,
  TrashIcon,
} from '../primitives';
import { Sheet } from '../sheet';
import { taskText } from './taskText';

interface Props {
  task: Task;
  lists: TaskList[];
  today: string;
  onSave: (patch: TaskPatch) => void;
  onEdit: () => void;
  onRemove: () => void;
  onClose: () => void;
  /** Copies text to the clipboard; resolves to whether it worked. */
  onCopy: (text: string) => Promise<boolean>;
  /** Present where the browser can share text. */
  onShare?: ((title: string, text: string) => Promise<boolean>) | undefined;
}

/**
 * What a tap on a task opens: the task as it is, with quick actions (edit, copy, share, delete).
 * Only the star and the steps can be changed here; everything else is behind «Edit».
 */
export function TaskCard({
  task,
  lists,
  today,
  onSave,
  onEdit,
  onRemove,
  onClose,
  onCopy,
  onShare,
}: Props) {
  const i18n = useI18n();
  const { t } = i18n;
  const [copied, setCopied] = useState(false);
  const listId = listOf(task, lists);
  const list = lists.find((l) => l.id === listId);
  const text = () => taskText(task, today, i18n, list?.name);

  return (
    <Sheet label={t('card.title')} onClose={onClose}>
      <div className="sheet-head">
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <button
          type="button"
          className={task.starred ? 'star on' : 'star'}
          aria-label={t('details.starred')}
          aria-pressed={task.starred}
          onClick={() => onSave({ starred: !task.starred })}
        >
          <StarIcon on={task.starred} />
        </button>
      </div>

      <h2
        className={task.status === 'done' ? 'card-title done-title' : 'card-title'}
        data-selectable
      >
        {task.title}
      </h2>

      {(list || task.due) && (
        <div className="card-meta">
          {list && (
            <span className="meta-chip" data-list-color={list.color}>
              <ListIcon />
              {list.name}
            </span>
          )}
          {task.due && (
            <span className="meta-chip">
              <CalendarIcon />
              {formatDue(task.due, today, i18n)}
              {task.dueTime ? ` · ${formatTime(task.dueTime, i18n)}` : ''}
              {task.repeat ? ` · ${t(`repeat.${task.repeat}`)}` : ''}
            </span>
          )}
        </div>
      )}

      {task.notes && (
        <p className="card-notes" data-selectable>
          {task.notes}
        </p>
      )}

      {task.steps && task.steps.length > 0 && (
        <ul className="card-steps" aria-label={t('steps.title')}>
          {task.steps.map((s) => (
            <li key={s.id} data-level={s.level}>
              <label>
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() =>
                    onSave({
                      steps: task.steps!.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)),
                    })
                  }
                />
                <span className={s.done ? 'done-title' : undefined}>{s.title}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="card-actions" role="group" aria-label={t('card.actions')}>
        <button type="button" onClick={onEdit}>
          <EditIcon />
          {t('card.edit')}
        </button>
        <button
          type="button"
          onClick={() =>
            void onCopy(text()).then((ok) => {
              setCopied(ok);
            })
          }
        >
          <CopyIcon />
          {t('card.copy')}
        </button>
        {onShare && (
          <button type="button" onClick={() => void onShare(task.title, text())}>
            <ShareIcon />
            {t('card.share')}
          </button>
        )}
        <button type="button" className="danger" onClick={onRemove}>
          <TrashIcon />
          {t('card.delete')}
        </button>
      </div>
      <p className="hint" role="status">
        {copied ? t('card.copied') : ''}
      </p>
    </Sheet>
  );
}
