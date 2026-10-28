import { useState, type FormEvent } from 'react';
import { PlusIcon } from '../primitives';

/** The "add" row at the top of the list: one line, Enter or the plus button adds. */
export function Composer({ onAdd }: { onAdd: (title: string) => void }) {
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
      <span className="composer-plus" aria-hidden="true">
        <PlusIcon />
      </span>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ناوي تعمل إيه؟"
        aria-label="ناوي تعمل إيه؟"
        enterKeyHint="done"
        autoComplete="off"
        maxLength={1000}
      />
      <button type="submit" className="composer-add" aria-label="إضافة" disabled={empty}>
        إضافة
      </button>
    </form>
  );
}
