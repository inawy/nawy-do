import { useState, type FormEvent } from 'react';
import { useT } from '../i18n';
import { PlusIcon } from '../primitives';

/** The "add" row at the top of the list: one line, Enter or the round plus button adds. */
export function Composer({
  onAdd,
  autoFocus = false,
}: {
  onAdd: (title: string) => void;
  autoFocus?: boolean;
}) {
  const t = useT();
  const [text, setText] = useState('');
  const empty = text.trim() === '';
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (empty) return;
    onAdd(text);
    setText('');
  };
  return (
    <form className="composer" onSubmit={submit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('app.prompt')}
        aria-label={t('app.prompt')}
        autoFocus={autoFocus}
        enterKeyHint="done"
        autoComplete="off"
        maxLength={1000}
      />
      <button
        type="submit"
        className="composer-add"
        aria-label={t('composer.add')}
        disabled={empty}
      >
        <PlusIcon />
      </button>
    </form>
  );
}
