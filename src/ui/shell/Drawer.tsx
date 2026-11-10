import { useEffect, useState, type ReactNode } from 'react';
import { useI18n, LANGS, type Lang } from '../i18n';
import { CloseIcon, DataIcon, IconButton, LanguageIcon, PlusIcon } from '../primitives';
import { loadTheme, setTheme, THEMES } from '../theme';
import { useBackClose } from '../sheet/useBackClose';
import { useFocusTrap } from '../sheet/useFocusTrap';

interface Props {
  onClose: () => void;
  onData: () => void;
  /** Present while the browser offers to install the app. */
  onInstall?: (() => void) | undefined;
}

/** One choice out of a few, as a row of buttons (a radio group). */
function Segmented<V extends string>(p: {
  label: string;
  icon?: ReactNode;
  value: V;
  options: { value: V; text: string }[];
  onChange: (value: V) => void;
}) {
  return (
    <div className="setting">
      <p className="setting-label">
        {p.icon}
        {p.label}
      </p>
      <div className="segmented" role="radiogroup" aria-label={p.label}>
        {p.options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === p.value}
            className={o.value === p.value ? 'on' : undefined}
            onClick={() => p.onChange(o.value)}
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}

const NAMES: Record<Lang, string> = { ar: 'العربية', en: 'English' };

/** The side menu: settings and data (the lists themselves are the tabs). */
export function Drawer({ onClose, onData, onInstall }: Props) {
  const { t, lang, setLang } = useI18n();
  const [theme, setThemeState] = useState(loadTheme);
  useBackClose(onClose);
  const trap = useFocusTrap<HTMLDivElement>();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <div className="backdrop drawer-backdrop" onClick={onClose}>
      <div
        ref={trap.ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('menu.drawer')}
        tabIndex={-1}
        onKeyDown={trap.onKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <p className="brand">{t('app.name')}</p>
          <IconButton label={t('common.close')} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <p className="drawer-section">{t('drawer.settings')}</p>
        <Segmented
          label={t('drawer.theme')}
          value={theme}
          options={THEMES.map((v) => ({ value: v, text: t(`theme.${v}`) }))}
          onChange={(v) => {
            setThemeState(v);
            setTheme(v);
          }}
        />
        {setLang && (
          <Segmented
            label={t('drawer.language')}
            icon={<LanguageIcon />}
            value={lang}
            options={LANGS.map((l) => ({ value: l, text: NAMES[l] }))}
            onChange={(l) => {
              setLang(l);
              onClose();
            }}
          />
        )}
        <p className="drawer-section">{t('drawer.data')}</p>
        <button type="button" className="drawer-item" onClick={pick(onData)}>
          <DataIcon />
          {t('menu.data')}
        </button>
        {onInstall && (
          <button type="button" className="drawer-item" onClick={pick(onInstall)}>
            <PlusIcon />
            {t('menu.install')}
          </button>
        )}
        <p className="drawer-foot">{t('drawer.footer')}</p>
      </div>
    </div>
  );
}
