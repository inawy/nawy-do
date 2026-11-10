import { useEffect, useRef } from 'react';
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

/** The views in the order the tabs show them: what a page swipe steps through. */
export const navOrder = (lists: TaskList[]): Selection[] => [
  ...SMART.map((s) => s.id),
  ...lists.map((l) => listSelection(l.id)),
];

interface Props {
  selection: Selection;
  counts: Counts;
  lists: TaskList[];
  onSelect: (s: Selection) => void;
  onNewList: () => void;
}

/** Side list on wide screens, a scrolling tab strip along the top on phones (CSS moves it). */
export function Nav({ selection, counts, lists, onSelect, onNewList }: Props) {
  const t = useT();
  const root = useRef<HTMLElement>(null);
  // On the phone the tabs scroll: keep the open one in view.
  useEffect(() => {
    root.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
  }, [selection]);
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
      className={`${selection === id ? 'nav-item on' : 'nav-item'}${extra}${id === 'starred' ? ' nav-star' : ''}`}
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
    <nav className="nav" ref={root} aria-label={t('nav.label')}>
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
        <span className="nav-label">{t('nav.newList')}</span>
      </button>
    </nav>
  );
}
