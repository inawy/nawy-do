import { useI18n } from '../i18n';
import type { TasksScreenProps } from './types';

/** The banners above the list: due tasks, backup reminder, app update, a failed write. */
export function Notices({ p, onOpenData }: { p: TasksScreenProps; onOpenData: () => void }) {
  const { t, num } = useI18n();
  return (
    <>
      {p.dueNotice && (
        <div className="update" role="status">
          <span>
            {t('notice.attention')}{' '}
            {[
              p.dueNotice.overdue > 0 && t('notice.overdue', { count: num(p.dueNotice.overdue) }),
              p.dueNotice.today > 0 && t('notice.today', { count: num(p.dueNotice.today) }),
            ]
              .filter(Boolean)
              .join('، ')}
          </span>
          <button type="button" onClick={p.dueNotice.onShow}>
            {t('notice.show')}
          </button>
          <button type="button" className="later" onClick={p.dueNotice.onLater}>
            {t('notice.later')}
          </button>
        </div>
      )}
      {p.backupNudge && !p.dueNotice && (
        <div className="update" role="status">
          <span>{t('notice.backup')}</span>
          <button type="button" onClick={onOpenData}>
            {t('notice.backupDo')}
          </button>
          <button type="button" className="later" onClick={p.backupNudge.onLater}>
            {t('notice.later')}
          </button>
        </div>
      )}
      {p.applyUpdate && (
        <div className="update" role="status">
          <span>{t('notice.update')}</span>
          <button type="button" onClick={p.applyUpdate}>
            {t('notice.updateDo')}
          </button>
        </div>
      )}
      {p.writeFailed && (
        <p className="status" role="alert">
          {t('notice.writeFailed')}
        </p>
      )}
    </>
  );
}
