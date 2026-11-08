import { useEffect } from 'react';
import { useT } from '../i18n';

const VISIBLE_MS = 7000;

export function UndoToast({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  useEffect(() => {
    const id = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(id);
  }, [message, onDismiss]);
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onUndo}>
        {t('toast.undo')}
      </button>
    </div>
  );
}
