import { listSelection, type Counts, type Selection, type TaskList } from '@/core/model';
import {
  AllIcon,
  CalendarIcon,
  ListIcon,
  PlusIcon,
  StarredNavIcon,
  TodayIcon,
} from '../primitives';
import { useT, type MessageKey } from '../i18n';

const SMART: {
  id: Selection;
  label: MessageKey;
  icon: () => React.JSX.Element;
  count: keyof Counts;
}[] = [
  { id: 'main', label: 'view.main', icon: AllIcon, count: 'main' },
  { id: 'today', label: 'view.today', icon: TodayIcon, count: 'today' },
  { id: 'starred', label: 'view.starred', icon: StarredNavIcon, count: 'starred' },
  { id: 'scheduled', label: 'view.scheduled', icon: CalendarIcon, count: 'scheduled' },
];

interface Props {
  selection: Selection;
  counts: Counts;
  lists: TaskList[];
  onSelect: (s: Selection) => void;
  onNewList: () => void;
}

/** Side list on wide screens, a scrolling bottom bar on phones (the same element; CSS moves it). */
export function Nav({ selection, counts, lists, onSelect, onNewList }: Props) {
  const t = useT();
  const item = (
    id: Selection,
    label: string,
    Icon: () => React.JSX.Element,
    count: number,
    extra = '',
    color?: string,
    dropTarget?: string,
  ) => (
    <button
      key={id}
      type="button"
      className={`${selection === id ? 'nav-item on' : 'nav-item'}${extra}`}
      aria-current={selection === id ? 'page' : undefined}
      data-list-color={color}
      data-drop-list={dropTarget}
      onClick={() => onSelect(id)}
    >
      <span className="nav-icon">
        <Icon />
      </span>
      <span className="nav-label">{label}</span>
      {count > 0 && (
        <span className="nav-count" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <nav className="nav" aria-label={t('nav.label')}>
      {SMART.map(({ id, label, icon, count }) =>
        item(
          id,
          t(label),
          icon,
          counts[count] as number,
          '',
          undefined,
          id === 'main' ? 'main' : undefined,
        ),
      )}
      {lists.length > 0 && <hr className="nav-sep" />}
      {lists.map((l) =>
        item(listSelection(l.id), l.name, ListIcon, counts.lists[l.id] ?? 0, '', l.color, l.id),
      )}
      <button type="button" className="nav-item nav-new" onClick={onNewList}>
        <span className="nav-icon">
          <PlusIcon />
        </span>
        <span className="nav-label nav-new-label">{t('nav.newList')}</span>
      </button>
    </nav>
  );
}
