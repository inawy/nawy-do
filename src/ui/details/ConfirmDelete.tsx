import { TRASH_DAYS } from '@/core/model';
import { useI18n } from '../i18n';
import { Button } from '../primitives';

/** «Delete this?» in place of the action row: one more tap, and it says where the task goes. */
export function ConfirmDelete({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t, num } = useI18n();
  return (
    <div className="confirm">
      <p className="confirm-text" role="alert">
        {t('delete.ask', { days: num(TRASH_DAYS) })}
      </p>
      <div className="actions">
        <span className="spacer" />
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="dangerSolid" onClick={onConfirm} autoFocus>
          {t('delete.confirm')}
        </Button>
      </div>
    </div>
  );
}
