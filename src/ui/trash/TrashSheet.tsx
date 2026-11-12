import { useState } from 'react';
import { TRASH_DAYS, TRASH_TTL_MS, type TrashEntry } from '@/core/model';
import { useI18n } from '../i18n';
import { Illustration } from '../illustrations';
import { Button, CloseIcon, IconButton, TrashIcon } from '../primitives';
import { Sheet } from '../sheet';

interface Props {
  items: TrashEntry[];
  now: number;
  /** The list limit is reached, so a deleted list cannot come back yet. */
  listsFull: boolean;
  onRestore: (entry: TrashEntry) => void;
  onDelete: (entries: TrashEntry[]) => void;
  onClose: () => void;
}

const DAY = 24 * 60 * 60 * 1000;
const key = (e: TrashEntry) => `${e.kind}:${e.id}`;

/** The trash: deleted tasks and lists, kept for `TRASH_DAYS`, each restorable or deletable for good. */
export function TrashSheet({ items, now, listsFull, onRestore, onDelete, onClose }: Props) {
  const { t, num } = useI18n();
  // `all`: «empty the trash» asked once; a key: that row's delete-forever asked once.
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
        <div className="empty" role="status">
          <Illustration name="trash" />
          <p>{t('trash.empty')}</p>
        </div>
      ) : (
        <ul className="trash-list">
          {items.map((e) => {
            const age = Math.max(0, Math.floor((now - e.deletedAt) / DAY));
            const left = Math.max(0, Math.ceil((e.deletedAt + TRASH_TTL_MS - now) / DAY));
            const blocked = e.kind === 'list' && listsFull;
            return (
              <li key={key(e)} className="trash-item" data-list-color={e.color}>
                <div className="trash-text">
                  <span className="trash-title">
                    {e.kind === 'list' && <span className="trash-kind">{t('trash.list')}</span>}
                    {e.title}
                  </span>
                  <span className="trash-meta">
                    {age === 0 ? t('trash.today') : t('trash.ago', { days: num(age) })}
                    {' · '}
                    {t('trash.left', { days: num(left) })}
                  </span>
                  {blocked && <span className="trash-meta">{t('trash.listsFull')}</span>}
                </div>
                <Button variant="text" disabled={blocked} onClick={() => onRestore(e)}>
                  {t('trash.restore')}
                </Button>
                {confirm === key(e) ? (
                  <Button
                    variant="dangerSolid"
                    onClick={() => {
                      setConfirm(null);
                      onDelete([e]);
                    }}
                  >
                    {t('trash.confirm')}
                  </Button>
                ) : (
                  <IconButton
                    label={t('trash.deleteOne', { name: e.title })}
                    className="danger-icon"
                    onClick={() => setConfirm(key(e))}
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
                onDelete(items);
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
