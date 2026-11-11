import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { TaskList } from '@/core/model';
import { useI18n } from '../i18n';
import { AllIcon, CloseIcon, IconButton, ListIcon } from '../primitives';
import { Sheet } from '../sheet';

interface Props {
  count: number;
  lists: TaskList[];
  onMove: (listId: string | undefined) => void;
  onComplete: () => void;
  onCancel: () => void;
}

/** Shown instead of the composer while tasks are being picked: cancel, count, two actions. */
export function SelectBar({ count, lists, onMove, onComplete, onCancel }: Props) {
  const { t, num } = useI18n();
  const [moving, setMoving] = useState(false);
  const none = count === 0;
  return (
    <div className="select-bar" role="toolbar" aria-label={t('select.label')}>
      <IconButton label={t('select.cancel')} onClick={onCancel}>
        <CloseIcon />
      </IconButton>
      <span className="count" role="status">
        {none ? t('select.none') : t('select.count', { count: num(count) })}
      </span>
      <button
        type="button"
        className="bar-action"
        aria-label={t('select.moveLabel')}
        aria-haspopup="dialog"
        disabled={none}
        onClick={() => setMoving(true)}
      >
        <ListIcon />
        <span>{t('select.move')}</span>
      </button>
      <button
        type="button"
        className="bar-action primary"
        aria-label={t('select.complete')}
        disabled={none}
        onClick={onComplete}
      >
        <AllIcon />
        <span>{t('select.doneShort')}</span>
      </button>
      {moving &&
        createPortal(
          <Sheet label={t('select.moveLabel')} onClose={() => setMoving(false)}>
            <div className="sheet-head">
              <h2 className="sheet-heading">{t('select.moveLabel')}</h2>
              <IconButton label={t('common.close')} onClick={() => setMoving(false)}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="choice-list" role="group" aria-label={t('select.moveLabel')}>
              <button
                type="button"
                className="choice"
                onClick={() => {
                  setMoving(false);
                  onMove(undefined);
                }}
              >
                <span className="dot" />
                {t('view.main')}
              </button>
              {lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="choice"
                  data-list-color={l.color}
                  onClick={() => {
                    setMoving(false);
                    onMove(l.id);
                  }}
                >
                  <span className="dot" />
                  {l.name}
                </button>
              ))}
            </div>
          </Sheet>,
          document.body,
        )}
    </div>
  );
}
