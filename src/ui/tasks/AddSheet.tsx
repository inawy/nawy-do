import { useState } from 'react';
import { findListByName, parseQuickAdd, type TaskList } from '@/core/model';
import { Button, CloseIcon, IconButton, PlusIcon, TextInput } from '../primitives';
import { useI18n } from '../i18n';
import { formatDue, formatTime } from '../i18n/format';
import { Sheet } from '../sheet';

/** The round floating button that opens the add sheet (phone and desktop alike). */
export function AddButton({ onClick }: { onClick: () => void }) {
  const t = useI18n().t;
  return (
    <button type="button" className="fab" aria-label={t('composer.new')} onClick={onClick}>
      <PlusIcon />
    </button>
  );
}

/**
 * A small sheet with one field: type the intention, Enter or «Add» saves it and closes. Dates,
 * times, repeats, «!» and «#list» written in the text are read and shown below the field as chips
 * before saving; «as typed» turns that off for this one.
 */
export function AddSheet({
  today,
  lists,
  onAdd,
  onClose,
}: {
  today: string;
  lists: TaskList[];
  onAdd: (text: string, literal: boolean) => void;
  onClose: () => void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const [text, setText] = useState('');
  const [literal, setLiteral] = useState(false);
  const empty = text.trim() === '';
  const read = literal ? undefined : parseQuickAdd(text, today, lists);
  const list = findListByName(lists, read?.listName);
  const chips: string[] = [];
  if (read?.due) chips.push(formatDue(read.due, today, i18n));
  if (read?.dueTime) chips.push(formatTime(read.dueTime, i18n));
  if (read?.repeat) chips.push(t(`repeat.${read.repeat}`));
  if (read?.starred) chips.push(t('details.starred'));
  if (list) chips.push(list.name);
  const understood = read !== undefined && read.matches.length > 0;
  return (
    <Sheet
      label={t('composer.new')}
      onClose={onClose}
      onSubmit={() => {
        if (empty) return;
        onAdd(text, literal);
        onClose();
      }}
    >
      <div className="sheet-head">
        <h2 className="sheet-heading">{t('composer.new')}</h2>
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <TextInput
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('app.prompt')}
        aria-label={t('app.prompt')}
        enterKeyHint="done"
        autoComplete="off"
        maxLength={1000}
        autoFocus
      />
      <p className="hint">{t('composer.hint')}</p>
      {understood && (
        <div className="card-meta" role="status" aria-label={t('composer.read')}>
          {chips.map((c) => (
            <span key={c} className="meta-chip">
              {c}
            </span>
          ))}
          <Button variant="text" onClick={() => setLiteral(true)}>
            {t('composer.literal')}
          </Button>
        </div>
      )}
      <div className="actions">
        <span className="spacer" />
        <Button type="submit" variant="primary" disabled={empty}>
          {t('composer.add')}
        </Button>
      </div>
    </Sheet>
  );
}
