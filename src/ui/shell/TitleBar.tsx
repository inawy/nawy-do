import { SORT_MODES, type SortMode } from '@/core/model';
import { useI18n } from '../i18n';
import { Button, IconButton, SearchIcon, SortIcon } from '../primitives';
import { MoreMenu, type MenuAction } from './MoreMenu';

interface Props {
  title: string;
  searchOn: boolean;
  selecting: boolean;
  /** Present when a list is open: its options. */
  onListOptions?: (() => void) | undefined;
  onSearch: () => void;
  onSelect: () => void;
  /** Present when finished tasks are showing: asks to delete them all. */
  onClearDone?: (() => void) | undefined;
  /** Present when the view can be sorted: the current mode and how to change it. */
  sort?: { mode: SortMode; onChange: (mode: SortMode) => void } | undefined;
}

/** The heading, search, the sort arrows and the «more» menu (select, list options). */
export function TitleBar(p: Props) {
  const { t } = useI18n();
  const actions: MenuAction[] = [{ label: t('menu.select'), onPick: p.onSelect }];
  if (p.onClearDone) actions.push({ label: t('menu.clearDone'), onPick: p.onClearDone });
  if (p.onListOptions) actions.push({ label: t('menu.listOptions'), onPick: p.onListOptions });
  const sorts: MenuAction[] = SORT_MODES.map((mode) => ({
    label: t(`sort.${mode}`),
    checked: p.sort?.mode === mode,
    onPick: () => p.sort?.onChange(mode),
  }));
  return (
    <div className="title-row">
      <h1>{p.title}</h1>
      <span className="title-actions">
        {p.selecting ? (
          <Button variant="text" onClick={p.onSelect}>
            {t('menu.done')}
          </Button>
        ) : (
          <>
            {p.sort && <MoreMenu label={t('menu.sort')} icon={<SortIcon />} actions={sorts} />}
            <IconButton label={t('menu.search')} aria-pressed={p.searchOn} onClick={p.onSearch}>
              <SearchIcon />
            </IconButton>
            <MoreMenu actions={actions} />
          </>
        )}
      </span>
    </div>
  );
}
