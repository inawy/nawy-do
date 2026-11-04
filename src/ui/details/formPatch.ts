import type { Repeat, Step, TaskPatch } from '@/core/model';

/** What the details form holds; `''` means "none" for the optional text fields. */
export interface DetailsForm {
  title: string;
  notes: string;
  due: string;
  dueTime: string;
  repeat: Repeat | '';
  starred: boolean;
  steps: Step[];
  listId: string;
}

const sameSteps = (a: readonly Step[], b: readonly Step[]): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Only the fields the person changed. Saving the whole form would bump `updatedAt` on an
 * untouched task, overwrite edits made elsewhere meanwhile, and replace a deleted list's id
 * (kept on purpose so undoing the list delete brings the task back) with the main list.
 */
export function changedFields(before: DetailsForm, after: DetailsForm): TaskPatch {
  const patch: TaskPatch = {};
  if (after.title.trim() !== '' && after.title.trim() !== before.title.trim()) {
    patch.title = after.title;
  }
  if (after.notes.trim() !== before.notes.trim()) patch.notes = after.notes;
  if (after.starred !== before.starred) patch.starred = after.starred;
  const dueTime = after.due === '' ? '' : after.dueTime;
  const repeat = after.due === '' ? '' : after.repeat;
  if (after.due !== before.due) patch.due = after.due;
  if (dueTime !== before.dueTime) patch.dueTime = dueTime;
  if (repeat !== before.repeat) patch.repeat = repeat;
  if (!sameSteps(before.steps, after.steps)) patch.steps = after.steps;
  if (after.listId !== before.listId) patch.listId = after.listId;
  return patch;
}
