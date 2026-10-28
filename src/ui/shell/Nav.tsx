import { listSelection, type Counts, type Selection, type TaskList } from '@/core/model';
import { AllIcon, CalendarIcon, ListIcon, PlusIcon, StarredNavIcon } from '../primitives';

const SMART: {
  id: Selection;
  label: string;
  icon: () => React.JSX.Element;
  count: keyof Counts;
}[] = [
  { id: 'main', label: 'نواياي', icon: AllIcon, count: 'main' },
  { id: 'starred', label: 'المفضلة', icon: StarredNavIcon, count: 'starred' },
  { id: 'scheduled', label: 'مجدولة', icon: CalendarIcon, count: 'scheduled' },
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
  const item = (
    id: Selection,
    label: string,
    Icon: () => React.JSX.Element,
    count: number,
    extra = '',
  ) => (
    <button
      key={id}
      type="button"
      className={`${selection === id ? 'nav-item on' : 'nav-item'}${extra}`}
      aria-current={selection === id ? 'page' : undefined}
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
    <nav className="nav" aria-label="العرض">
      {SMART.map(({ id, label, icon, count }) => item(id, label, icon, counts[count] as number))}
      {lists.length > 0 && <hr className="nav-sep" />}
      {lists.map((l) => item(listSelection(l.id), l.name, ListIcon, counts.lists[l.id] ?? 0))}
      <button type="button" className="nav-item nav-new" onClick={onNewList}>
        <span className="nav-icon">
          <PlusIcon />
        </span>
        <span className="nav-label">قائمة جديدة</span>
      </button>
    </nav>
  );
}
