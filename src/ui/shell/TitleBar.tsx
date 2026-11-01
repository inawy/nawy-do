import { SearchIcon } from '../primitives';
import { MoreMenu, type MenuAction } from './MoreMenu';

interface Props {
  title: string;
  searchOn: boolean;
  selecting: boolean;
  /** Present when a list is open: its options. */
  onListOptions?: (() => void) | undefined;
  onSearch: () => void;
  onSelect: () => void;
  onData: () => void;
}

/** The heading, search, and the «more» menu (select, data, list options). */
export function TitleBar(p: Props) {
  const actions: MenuAction[] = [
    { label: 'تحديد', onPick: p.onSelect },
    { label: 'بياناتي', onPick: p.onData },
  ];
  if (p.onListOptions) actions.push({ label: 'خيارات القائمة', onPick: p.onListOptions });
  return (
    <div className="title-row">
      <h1>{p.title}</h1>
      <span className="title-actions">
        <button
          type="button"
          className="icon"
          aria-label="بحث"
          aria-pressed={p.searchOn}
          onClick={p.onSearch}
        >
          <SearchIcon />
        </button>
        {p.selecting ? (
          <button type="button" className="text-action" onClick={p.onSelect}>
            تم
          </button>
        ) : (
          <MoreMenu actions={actions} />
        )}
      </span>
    </div>
  );
}
