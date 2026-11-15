import { useI18n } from '../i18n';
import { UndoToast } from '../tasks';
import type { TasksScreenProps } from './types';

/** The «deleted · undo» toast for the last removed task or list. */
export function RemovedToast({ p }: { p: TasksScreenProps }) {
  const { t } = useI18n();
  if (!p.removed) return null;
  const more = p.removed.more > 0 ? ` (+${p.removed.more})` : '';
  const key = p.removed.kind === 'list' ? 'toast.removedList' : 'toast.removed';
  return (
    <UndoToast
      message={t(key, { name: p.removed.label }) + more}
      onUndo={p.onUndo}
      onDismiss={p.onDismissUndo}
    />
  );
}
