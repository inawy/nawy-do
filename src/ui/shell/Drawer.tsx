import { useEffect } from 'react';
import { useI18n, LANGS, type Lang } from '../i18n';
import { CloseIcon, DataIcon, IconButton, LanguageIcon, PlusIcon } from '../primitives';
import { useBackClose } from '../sheet/useBackClose';
import { useFocusTrap } from '../sheet/useFocusTrap';

interface Props {
  onClose: () => void;
  onData: () => void;
  /** Present while the browser offers to install the app. */
  onInstall?: (() => void) | undefined;
}

const NAMES: Record<Lang, string> = { ar: 'العربية', en: 'English' };

/** The side menu: settings and data (the lists themselves are the tabs). */
export function Drawer({ onClose, onData, onInstall }: Props) {
  const { t, lang, setLang } = useI18n();
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
        {setLang && (
          <div className="drawer-group" role="radiogroup" aria-label={t('drawer.language')}>
            <p className="drawer-label">
              <LanguageIcon />
              {t('drawer.language')}
            </p>
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={l === lang}
                className={l === lang ? 'drawer-lang on' : 'drawer-lang'}
                onClick={() => {
                  setLang(l);
                  onClose();
                }}
              >
                {NAMES[l]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
