import { useState } from 'react';
import { Button, CloseIcon, IconButton, PlusIcon, TextInput } from '../primitives';
import { useT } from '../i18n';
import { Sheet } from '../sheet';

/** The round floating button that opens the add sheet (phone and desktop alike). */
export function AddButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button type="button" className="fab" aria-label={t('composer.new')} onClick={onClick}>
      <PlusIcon />
    </button>
  );
}

/** A small sheet with one field: type the intention, Enter or «Add» saves it and closes. */
export function AddSheet({
  onAdd,
  onClose,
}: {
  onAdd: (title: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [text, setText] = useState('');
  const empty = text.trim() === '';
  return (
    <Sheet
      label={t('composer.new')}
      onClose={onClose}
      onSubmit={() => {
        if (empty) return;
        onAdd(text);
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
      <div className="actions">
        <span className="spacer" />
        <Button type="submit" variant="primary" disabled={empty}>
          {t('composer.add')}
        </Button>
      </div>
    </Sheet>
  );
}
