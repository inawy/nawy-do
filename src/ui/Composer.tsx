import { useState, type FormEvent } from 'react';

export function Composer({ onAdd }: { onAdd: (title: string) => void }) {
  const [text, setText] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim() === '') return;
    onAdd(text);
    setText('');
  };
  return (
    <form className="composer" onSubmit={submit}>
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
      <button type="submit" disabled={text.trim() === ''}>
        إضافة
      </button>
    </form>
  );
}
