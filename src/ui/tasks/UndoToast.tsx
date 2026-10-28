import { useEffect } from 'react';

const VISIBLE_MS = 7000;

export function UndoToast({
  title,
  onUndo,
  onDismiss,
}: {
  title: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(id);
  }, [title, onDismiss]);
  return (
    <div className="toast" role="status">
      <span>اتحذفت: {title}</span>
      <button type="button" onClick={onUndo}>
        تراجع
      </button>
    </div>
  );
}
