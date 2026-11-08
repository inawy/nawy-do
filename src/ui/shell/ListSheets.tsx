import { useState } from 'react';
import {
  listSelection,
  type ListColor,
  type ListPatch,
  type Selection,
  type TaskList,
} from '@/core/model';
import { ListSheet } from '../lists';
import { useT } from '../i18n';
import type { ListSheetState } from './useScreenState';

const LIST_ERRORS = { limit: 'lists.limit', failed: 'lists.failed' } as const;

interface Props {
  sheet: ListSheetState;
  lists: TaskList[];
  onClose: () => void;
  onSelect: (s: Selection) => void;
  onAdd: (name: string, color?: ListColor) => Promise<TaskList | 'empty' | 'limit' | 'failed'>;
  onEdit: (list: TaskList, patch: ListPatch) => void;
  onDelete: (list: TaskList) => void;
  onMove: (list: TaskList, delta: -1 | 1) => void;
}

/** Creating a list, and the options (rename, order, delete) of an existing one. */
export function ListSheets({
  sheet,
  lists,
  onClose,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: Props) {
  const t = useT();
  const [error, setError] = useState<string | undefined>();
  const close = () => {
    setError(undefined);
    onClose();
  };
  const editing = sheet?.mode === 'edit' ? lists.find((l) => l.id === sheet.id) : undefined;
  const index = editing ? lists.findIndex((l) => l.id === editing.id) : -1;

  if (sheet?.mode === 'create') {
    return (
      <ListSheet
        mode="create"
        initialName=""
        error={error}
        onClose={close}
        onSave={(name, color) => {
          void onAdd(name, color === '' ? undefined : color).then((result) => {
            if (typeof result === 'object') {
              onSelect(listSelection(result.id));
              close();
            } else if (result !== 'empty') {
              setError(t(LIST_ERRORS[result]));
            }
          });
        }}
      />
    );
  }
  if (!editing) return null;
  return (
    <ListSheet
      mode="edit"
      initialName={editing.name}
      initialColor={editing.color}
      canMoveEarlier={index > 0}
      canMoveLater={index < lists.length - 1}
      onMove={(delta) => onMove(editing, delta)}
      onClose={close}
      onSave={(name, color) => {
        onEdit(editing, { name, color });
        close();
      }}
      onDelete={() => {
        onDelete(editing);
        onSelect('main');
        close();
      }}
    />
  );
}
