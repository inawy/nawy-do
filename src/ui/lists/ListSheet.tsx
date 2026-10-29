import { useEffect, useState } from 'react';
import { MAX_LIST_NAME } from '@/core/model';
import { CloseIcon, TrashIcon } from '../primitives';

interface Props {
  mode: 'create' | 'edit';
  initialName: string;
  /** Why the last save was refused, shown under the field. */
  error?: string | undefined;
  onSave: (name: string) => void;
  /** Edit mode: whether the list can move earlier / later, and the move itself. */
  canMoveEarlier?: boolean;
  canMoveLater?: boolean;
  onMove?: (delta: -1 | 1) => void;
  /** Only in edit mode. */
  onDelete?: () => void;
  onClose: () => void;
}

/** Create or rename a list; deleting asks for one more tap and says what happens to the tasks. */
export function ListSheet({
  mode,
  initialName,
  error,
  canMoveEarlier,
  canMoveLater,
  onMove,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState(initialName);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const empty = name.trim() === '';
  return (
    <div className="backdrop" onClick={onClose}>
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? 'قائمة جديدة' : 'خيارات القائمة'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!empty) onSave(name);
        }}
      >
        <div className="sheet-head">
          <h2 className="sheet-heading">{mode === 'create' ? 'قائمة جديدة' : 'خيارات القائمة'}</h2>
          <button type="button" className="icon" aria-label="إغلاق" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <label className="field">
          <span>اسم القائمة</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_LIST_NAME}
            autoFocus
            autoComplete="off"
          />
        </label>
        {mode === 'edit' && onMove && (
          <div className="move-row" role="group" aria-label="ترتيب القائمة">
            <button type="button" disabled={!canMoveEarlier} onClick={() => onMove(-1)}>
              قدّم القائمة
            </button>
            <button type="button" disabled={!canMoveLater} onClick={() => onMove(1)}>
              أخّر القائمة
            </button>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {confirming && (
          <p className="form-warn">
            هتتحذف القائمة، ونواياها هترجع لـ«نواياي». تقدر تتراجع بعدها مباشرة.
          </p>
        )}
        <div className="actions">
          {mode === 'edit' && onDelete && !confirming && (
            <button type="button" className="danger" onClick={() => setConfirming(true)}>
              <TrashIcon />
              حذف القائمة
            </button>
          )}
          {confirming && onDelete && (
            <button type="button" className="danger solid" onClick={onDelete}>
              تأكيد الحذف
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="primary" disabled={empty}>
            حفظ
          </button>
        </div>
      </form>
    </div>
  );
}
