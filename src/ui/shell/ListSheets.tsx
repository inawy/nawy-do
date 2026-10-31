import { useState } from 'react';
import { listSelection, type Selection, type TaskList } from '@/core/model';
import { ListSheet } from '../lists';
import type { ListSheetState } from './useScreenState';

const LIST_ERRORS = {
  limit: 'وصلت للحد الأقصى من القوائم.',
  failed: 'مقدرتش أحفظ القائمة. جرّب تاني.',
} as const;

interface Props {
  sheet: ListSheetState;
  lists: TaskList[];
  onClose: () => void;
  onSelect: (s: Selection) => void;
  onAdd: (name: string) => Promise<TaskList | 'empty' | 'limit' | 'failed'>;
  onRename: (list: TaskList, name: string) => void;
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
  onRename,
  onDelete,
  onMove,
}: Props) {
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
        onSave={(name) => {
          void onAdd(name).then((result) => {
            if (typeof result === 'object') {
              onSelect(listSelection(result.id));
              close();
            } else if (result !== 'empty') {
              setError(LIST_ERRORS[result]);
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
      canMoveEarlier={index > 0}
      canMoveLater={index < lists.length - 1}
      onMove={(delta) => onMove(editing, delta)}
      onClose={close}
      onSave={(name) => {
        onRename(editing, name);
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
