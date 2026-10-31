import { DataIcon, MoreIcon, SearchIcon } from '../primitives';

interface Props {
  title: string;
  searchOn: boolean;
  selecting: boolean;
  /** Present when a list is open: its options button. */
  onListOptions?: (() => void) | undefined;
  onSearch: () => void;
  onSelect: () => void;
  onData: () => void;
}

/** The heading and the always-there actions. */
export function TitleBar(p: Props) {
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
        <button type="button" onClick={p.onSelect}>
          {p.selecting ? 'تم' : 'تحديد'}
        </button>
        <button type="button" className="icon" aria-label="بياناتي" onClick={p.onData}>
          <DataIcon />
        </button>
        {p.onListOptions && (
          <button
            type="button"
            className="icon"
            aria-label="خيارات القائمة"
            onClick={p.onListOptions}
          >
            <MoreIcon />
          </button>
        )}
      </span>
    </div>
  );
}
