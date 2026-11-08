import type { TaskList } from '@/core/model';
import { useI18n } from '../i18n';

interface Props {
  count: number;
  lists: TaskList[];
  onMove: (listId: string | undefined) => void;
  onComplete: () => void;
}

const MAIN = '__main__';

/** Shown instead of the composer while tasks are being picked. */
export function SelectBar({ count, lists, onMove, onComplete }: Props) {
  const { t, num } = useI18n();
  return (
    <div className="select-bar" role="toolbar" aria-label={t('select.label')}>
      <span className="count" role="status">
        {count === 0 ? t('select.none') : t('select.count', { count: num(count) })}
      </span>
      <select
        aria-label={t('select.moveLabel')}
        value=""
        disabled={count === 0}
        onChange={(e) => onMove(e.target.value === MAIN ? undefined : e.target.value)}
      >
        <option value="" disabled>
          {t('select.move')}
        </option>
        <option value={MAIN}>{t('view.main')}</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <button type="button" disabled={count === 0} onClick={onComplete}>
        {t('select.complete')}
      </button>
    </div>
  );
}
