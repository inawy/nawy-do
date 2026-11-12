import { TRASH_DAYS } from '@/core/model';
import { useI18n } from '../i18n';
import { Button, CloseIcon, IconButton } from '../primitives';
import { Sheet } from '../sheet';

/** Confirms «delete all completed»: says how many and that they go to the trash. */
export function ClearDoneSheet({
  count,
  onConfirm,
  onClose,
}: {
  count: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t, num } = useI18n();
  return (
    <Sheet label={t('menu.clearDone')} onClose={onClose}>
      <div className="sheet-head">
        <h2 className="sheet-heading">{t('menu.clearDone')}</h2>
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <p className="confirm-text">
        {t('clearDone.ask', { count: num(count), days: num(TRASH_DAYS) })}
      </p>
      <div className="actions sticky-actions">
        <span className="spacer" />
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="dangerSolid" onClick={onConfirm} autoFocus>
          {t('delete.confirm')}
        </Button>
      </div>
    </Sheet>
  );
}
