import type { TaskList } from '@/core/model';

interface Props {
  count: number;
  lists: TaskList[];
  onMove: (listId: string | undefined) => void;
  onComplete: () => void;
}

const MAIN = '__main__';

/** Shown instead of the composer while tasks are being picked. */
export function SelectBar({ count, lists, onMove, onComplete }: Props) {
  return (
    <div className="select-bar" role="toolbar" aria-label="إجراءات على المحدد">
      <span className="count" role="status">
        {count === 0 ? 'اختار نوايا' : `${count} محدد`}
      </span>
      <select
        aria-label="نقل المحدد إلى"
        value=""
        disabled={count === 0}
        onChange={(e) => onMove(e.target.value === MAIN ? undefined : e.target.value)}
      >
        <option value="" disabled>
          نقل إلى…
        </option>
        <option value={MAIN}>نواياي</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <button type="button" disabled={count === 0} onClick={onComplete}>
        إنجاز المحدد
      </button>
    </div>
  );
}
