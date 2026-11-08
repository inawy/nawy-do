import type { TaskList } from '@/core/model';
import { useT } from '../i18n';
import { Composer } from '../tasks';
import { SelectBar } from './SelectBar';

interface Props {
  lists: TaskList[];
  /** Focus the add field on mount (the «new intention» shortcut). */
  focusAdd?: boolean;
  /** `null` when not selecting. */
  picked: ReadonlySet<string> | null;
  /** `null` when not searching. */
  query: string | null;
  onAdd: (title: string) => void;
  onQuery: (q: string) => void;
  onMoveMany: (ids: string[], listId: string | undefined) => void;
  onCompleteMany: (ids: string[]) => void;
  onDone: () => void;
}

/** The one input area: the composer, or the search field, or the selection actions. */
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
  return <Composer onAdd={p.onAdd} autoFocus={p.focusAdd === true} />;
}

/** Docked at the bottom on phones (thumb reach), inline on wide screens. */
export function InputBar(p: Props) {
  return (
    <div className="input-dock">
      <Bar {...p} />
    </div>
  );
}
