import { useI18n } from '../i18n';
import { CloseIcon, IconButton } from '../primitives';
import { Sheet } from '../sheet';

/** The keys and what they do. Space and Enter work on whatever row has focus, as on any control. */
const ROWS: [keys: string[], label: string][] = [
  [['N'], 'shortcuts.new'],
  [['/'], 'shortcuts.search'],
  [['↑', '↓'], 'shortcuts.move'],
  [['Space'], 'shortcuts.complete'],
  [['Enter'], 'shortcuts.open'],
  [['Ctrl', 'Z'], 'shortcuts.undo'],
  [['?'], 'shortcuts.help'],
];

/** A short list of the desktop keyboard shortcuts. */
export function ShortcutsSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Sheet label={t('menu.shortcuts')} onClose={onClose}>
      <div className="sheet-head">
        <h2 className="sheet-heading">{t('menu.shortcuts')}</h2>
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <dl className="shortcuts">
        {ROWS.map(([keys, label]) => (
          <div key={label} className="shortcut">
            <dt dir="ltr">
              {keys.map((k) => (
                <kbd key={k}>{k}</kbd>
              ))}
            </dt>
            <dd>{t(label)}</dd>
          </div>
        ))}
      </dl>
      <p className="hint">{t('shortcuts.hint')}</p>
    </Sheet>
  );
}
