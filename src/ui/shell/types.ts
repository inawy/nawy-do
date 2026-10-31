import type { Selection, Task, TaskList, TaskPatch } from '@/core/model';
import type { Outcome, SnapshotItem, StorageStatus } from '../backup';

/** Everything the «بياناتي» sheet needs; the screen only shows it. */
export interface DataProps {
  storage: StorageStatus;
  snapshots: SnapshotItem[];
  outcome: Outcome | null;
  /** Called when the sheet opens (loads the safety copies, clears the last result). */
  onOpen: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onRestore: (id: number) => void;
}

export interface TasksScreenProps {
  data: DataProps;
  tasks: Task[];
  lists: TaskList[];
  today: string;
  selection: Selection;
  ready: boolean;
  failed: boolean;
  editing: Task | undefined;
  /** The task or list just deleted (at most one is offered for undo). */
  removed: { kind: 'task' | 'list'; label: string } | null;
  /** Set when a new app version is waiting. */
  applyUpdate: (() => void) | undefined;
  onSelect: (s: Selection) => void;
  onAdd: (title: string) => void;
  onToggle: (t: Task) => void;
  onStar: (t: Task) => void;
  onOpen: (t: Task) => void;
  onMove: (id: string, toIndex: number) => void;
  /** Moves the selected tasks to a list (`undefined`: the main list). */
  onMoveMany: (ids: string[], listId: string | undefined) => void;
  onCompleteMany: (ids: string[]) => void;
  onClose: () => void;
  onSave: (t: Task, patch: TaskPatch) => void;
  onRemove: (t: Task) => void;
  onAddList: (name: string) => Promise<TaskList | 'empty' | 'limit' | 'failed'>;
  onRenameList: (list: TaskList, name: string) => void;
  onDeleteList: (list: TaskList) => void;
  onMoveList: (list: TaskList, delta: -1 | 1) => void;
  onUndo: () => void;
  onDismissUndo: () => void;
}
