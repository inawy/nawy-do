import { SORT_MODES, type SortMode } from '@/core/model';
import { useI18n } from '../i18n';
import { Button, IconButton, SearchIcon } from '../primitives';
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
  /** Present when the view can be sorted: the current mode and how to change it. */
  sort?: { mode: SortMode; onChange: (mode: SortMode) => void } | undefined;
  /** Present while the browser offers to install the app. */
  onInstall?: (() => void) | undefined;
}

/** The heading, search, and the «more» menu (select, data, list options). */
export function TitleBar(p: Props) {
  const { t, lang, setLang } = useI18n();
  const actions: MenuAction[] = [
    { label: t('menu.select'), onPick: p.onSelect },
    { label: t('menu.data'), onPick: p.onData },
  ];
  for (const mode of p.sort ? SORT_MODES : []) {
    actions.push({
      label: t(`sort.${mode}`),
      checked: p.sort?.mode === mode,
      onPick: () => p.sort?.onChange(mode),
    });
  }
  if (p.onInstall) actions.push({ label: t('menu.install'), onPick: p.onInstall });
  if (setLang) {
    const other = lang === 'ar' ? 'en' : 'ar';
    actions.push({ label: t(`menu.lang.${other}`), onPick: () => setLang(other) });
  }
  if (p.onListOptions) actions.push({ label: t('menu.listOptions'), onPick: p.onListOptions });
  return (
    <div className="title-row">
      <h1>{p.title}</h1>
      <span className="title-actions">
        <IconButton label={t('menu.search')} aria-pressed={p.searchOn} onClick={p.onSearch}>
          <SearchIcon />
        </IconButton>
        {p.selecting ? (
          <Button variant="text" onClick={p.onSelect}>
            {t('menu.done')}
          </Button>
        ) : (
          <MoreMenu actions={actions} />
        )}
      </span>
    </div>
  );
}
