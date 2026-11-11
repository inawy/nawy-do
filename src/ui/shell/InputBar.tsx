import type { TaskList } from '@/core/model';
import { useT } from '../i18n';
import { SelectBar } from './SelectBar';

interface Props {
  lists: TaskList[];
  /** `null` when not selecting. */
  picked: ReadonlySet<string> | null;
  /** `null` when not searching. */
  query: string | null;
  onQuery: (q: string) => void;
  onMoveMany: (ids: string[], listId: string | undefined) => void;
  onCompleteMany: (ids: string[]) => void;
  onDone: () => void;
  onCancel: () => void;
}

/** The bottom bar while searching or selecting (adding is the floating button). */
function Bar(p: Props) {
  const t = useT();
  if (p.picked) {
    const ids = [...p.picked];
    return (
      <SelectBar
        count={ids.length}
        lists={p.lists}
        onMove={(listId) => {
          p.onMoveMany(ids, listId);
          p.onDone();
        }}
        onCancel={p.onCancel}
        onComplete={() => {
          p.onCompleteMany(ids);
          p.onDone();
        }}
      />
    );
  }
  if (p.query !== null) {
    return (
      <div className="search-bar">
        <input
          type="search"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.label')}
          autoFocus
          autoComplete="off"
        />
      </div>
    );
  }
  return null;
}

/** Docked at the bottom on phones (thumb reach), inline on wide screens; empty when idle. */
export function InputBar(p: Props) {
  if (p.picked === null && p.query === null) return null;
  return (
    <div className="input-dock">
      <Bar {...p} />
    </div>
  );
}
