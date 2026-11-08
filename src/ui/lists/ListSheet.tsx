import { useState } from 'react';
import { MAX_LIST_NAME, type ListColor } from '@/core/model';
import { ColorPicker } from './ColorPicker';
import { Button, CloseIcon, Field, IconButton, TextInput, TrashIcon } from '../primitives';
import { useT } from '../i18n';
import { Sheet } from '../sheet';

interface Props {
  mode: 'create' | 'edit';
  initialName: string;
  initialColor?: ListColor | undefined;
  /** Why the last save was refused, shown under the field. */
  error?: string | undefined;
  onSave: (name: string, color: ListColor | '') => void;
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
  initialColor,
  error,
  canMoveEarlier,
  canMoveLater,
  onMove,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const t = useT();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<ListColor | ''>(initialColor ?? '');
  const [confirming, setConfirming] = useState(false);

  const empty = name.trim() === '';
  return (
    <Sheet
      label={mode === 'create' ? t('list.new') : t('list.options')}
      onClose={onClose}
      onSubmit={() => {
        if (!empty) onSave(name, color);
      }}
    >
      <div className="sheet-head">
        <h2 className="sheet-heading">{mode === 'create' ? t('list.new') : t('list.options')}</h2>
        <IconButton label={t('common.close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <Field label={t('list.name')}>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_LIST_NAME}
          autoFocus
          autoComplete="off"
        />
      </Field>
      <ColorPicker value={color} onChange={setColor} />
      {mode === 'edit' && onMove && (
        <div className="move-row" role="group" aria-label={t('list.order')}>
          <Button disabled={!canMoveEarlier} onClick={() => onMove(-1)}>
            {t('list.earlier')}
          </Button>
          <Button disabled={!canMoveLater} onClick={() => onMove(1)}>
            {t('list.later')}
          </Button>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {confirming && <p className="form-warn">{t('list.deleteWarn')}</p>}
      <div className="actions sticky-actions">
        {mode === 'edit' && onDelete && !confirming && (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            <TrashIcon />
            {t('list.delete')}
          </Button>
        )}
        {confirming && onDelete && (
          <Button variant="dangerSolid" onClick={onDelete}>
            {t('list.confirmDelete')}
          </Button>
        )}
        <span className="spacer" />
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={empty}>
          {t('common.save')}
        </Button>
      </div>
    </Sheet>
  );
}
