import type { ViewId } from '@/core/model';
import { AllIcon, CalendarIcon, StarredNavIcon } from './icons';

const ITEMS: { id: ViewId; label: string; icon: () => React.JSX.Element }[] = [
  { id: 'all', label: 'نواياي', icon: AllIcon },
  { id: 'starred', label: 'المفضلة', icon: StarredNavIcon },
  { id: 'scheduled', label: 'مجدولة', icon: CalendarIcon },
];

/** Side list on wide screens, bottom bar on phones (the same element; CSS moves it). */
export function Nav({
  view,
  counts,
  onChange,
}: {
  view: ViewId;
  counts: Record<ViewId, number>;
  onChange: (v: ViewId) => void;
}) {
  return (
    <nav className="nav" aria-label="العرض">
      {ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={view === id ? 'nav-item on' : 'nav-item'}
          aria-current={view === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <span className="nav-icon">
            <Icon />
          </span>
          <span className="nav-label">{label}</span>
          {counts[id] > 0 && (
            <span className="nav-count" aria-hidden="true">
              {counts[id]}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
