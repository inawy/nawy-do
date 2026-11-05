import type {
  ListColor,
  ListPatch,
  Selection,
  SortMode,
  Task,
  TaskList,
  TaskPatch,
} from '@/core/model';
import type { Outcome, SnapshotItem, StorageStatus } from '../backup';

/** Everything the «بياناتي» sheet needs; the screen only shows it. */
export interface DataProps {
  storage: StorageStatus;
  snapshots: SnapshotItem[];
  outcome: Outcome | null;
  /** Called when the sheet opens (loads the safety copies, clears the last result). */
  onOpen: () => void;
  onExport: () => void;
  /** Hands the backup to the system share sheet; absent where the browser cannot. */
  onShare?: () => void;
  /** When the last backup file was taken, already formatted; absent: never. */
  lastExport?: string;
  onImport: (file: File) => void;
  onRestore: (id: number) => void;
}

export interface TasksScreenProps {
  data: DataProps;
  /** Set when it is time to ask for a backup; «خُد نسخة» opens «بياناتي», «بعدين» hides it. */
  /** Overdue and due-today counts to flag when the app opens; «اعرضها» goes to «اليوم». */
  dueNotice?: { overdue: number; today: number; onShow: () => void; onLater: () => void };
  backupNudge?: { onLater: () => void };
  tasks: Task[];
  lists: TaskList[];
  today: string;
  newId: () => string;
  selection: Selection;
  ready: boolean;
  failed: boolean;
  /** A save did not go through: say so, the data on screen is unchanged. */
  writeFailed: boolean;
  editing: Task | undefined;
  /** The task or list just deleted (at most one is offered for undo). */
  /** The newest deletion; `more` = how many older ones can be undone after it. */
  removed: { kind: 'task' | 'list'; label: string; more: number } | null;
  sort: SortMode;
  onSort: (mode: SortMode) => void;
  /** Set when a new app version is waiting. */
  applyUpdate: (() => void) | undefined;
  /** Set while the browser offers to install the app. */
  onInstall: (() => void) | undefined;
  /** Opened by the «new intention» shortcut: focus the add field. */
  focusAdd: boolean;
  onSelect: (s: Selection) => void;
  onAdd: (title: string) => void;
  onToggle: (t: Task) => void;
  onStar: (t: Task) => void;
  onOpen: (t: Task) => void;
  onMove: (id: string, toIndex: number, shown: readonly string[]) => void;
  /** Moves the selected tasks to a list (`undefined`: the main list). */
  onMoveMany: (ids: string[], listId: string | undefined) => void;
  onCompleteMany: (ids: string[]) => void;
  onClose: () => void;
  onSave: (t: Task, patch: TaskPatch) => void;
  onRemove: (t: Task) => void;
  onAddList: (name: string, color?: ListColor) => Promise<TaskList | 'empty' | 'limit' | 'failed'>;
  onEditList: (list: TaskList, patch: ListPatch) => void;
  onDeleteList: (list: TaskList) => void;
  onMoveList: (list: TaskList, delta: -1 | 1) => void;
  onUndo: () => void;
  onDismissUndo: () => void;
}
