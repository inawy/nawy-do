import { useState } from 'react';
import { TRASH_DAYS, TRASH_TTL_MS, type Task } from '@/core/model';
import { useI18n } from '../i18n';
import { Button, CloseIcon, IconButton, TrashIcon } from '../primitives';
import { Sheet } from '../sheet';

interface Props {
  items: Task[];
  now: number;
  onRestore: (id: string) => void;
  onDelete: (ids: string[]) => void;
  onClose: () => void;
}

const DAY = 24 * 60 * 60 * 1000;

/** The trash: deleted tasks, kept for `TRASH_DAYS`, each restorable or deletable for good. */
export function TrashSheet({ items, now, onRestore, onDelete, onClose }: Props) {
  const { t, num } = useI18n();
  // `all`: «empty the trash» asked once; an id: that row's delete-forever asked once.
  const [confirm, setConfirm] = useState<string | 'all' | null>(null);

  return (
    <Sheet label={t('trash.title')} onClose={onClose}>
      <div className="sheet-head">
        <h2 className="sheet-heading">{t('trash.title')}</h2>
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <p className="hint">{t('trash.hint', { days: num(TRASH_DAYS) })}</p>
      {items.length === 0 ? (
        <p className="status" role="status">
          {t('trash.empty')}
        </p>
      ) : (
        <ul className="trash-list">
          {items.map((task) => {
            const age = Math.max(0, Math.floor((now - (task.deletedAt ?? now)) / DAY));
            const left = Math.max(
              0,
              Math.ceil(((task.deletedAt ?? now) + TRASH_TTL_MS - now) / DAY),
            );
            return (
              <li key={task.id} className="trash-item">
                <div className="trash-text">
                  <span className="trash-title">{task.title}</span>
                  <span className="trash-meta">
                    {age === 0 ? t('trash.today') : t('trash.ago', { days: num(age) })}
                    {' · '}
                    {t('trash.left', { days: num(left) })}
                  </span>
                </div>
                <Button variant="text" onClick={() => onRestore(task.id)}>
                  {t('trash.restore')}
                </Button>
                {confirm === task.id ? (
                  <Button
                    variant="dangerSolid"
                    onClick={() => {
                      setConfirm(null);
                      onDelete([task.id]);
                    }}
                  >
                    {t('trash.confirm')}
                  </Button>
                ) : (
                  <IconButton
                    label={t('trash.deleteOne', { name: task.title })}
                    className="danger-icon"
                    onClick={() => setConfirm(task.id)}
                  >
                    <TrashIcon />
                  </IconButton>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {items.length > 0 && (
        <div className="actions">
          {confirm === 'all' ? (
            <Button
              variant="dangerSolid"
              onClick={() => {
                setConfirm(null);
                onDelete(items.map((i) => i.id));
              }}
            >
              {t('trash.confirmAll')}
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirm('all')}>
              <TrashIcon />
              {t('trash.emptyAll')}
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}
