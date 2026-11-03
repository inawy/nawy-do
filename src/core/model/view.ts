import { selectedListId, type Selection } from './selection';
import type { SortMode } from './sorting';
import type { TaskList } from './types';

// What each view means. These are product rules, so they live in the core, testable without a UI.

/** A list that no longer exists (deleted here or elsewhere) falls back to the main list. */
export function resolveSelection(selection: Selection, lists: readonly TaskList[]): Selection {
  const id = selectedListId(selection);
  return id !== undefined && !lists.some((l) => l.id === id && l.deletedAt === undefined)
    ? 'main'
    : selection;
}

/** Does the sort choice apply to this view? (Scheduled and today are always by date.) */
export const isSortable = (view: Selection | 'search'): boolean =>
  view === 'main' || view === 'starred' || selectedListId(view) !== undefined;

/**
 * Only the main list and a single list can be re-ordered, and only in manual order: each shows all of its open tasks, so a
 * move is unambiguous. Favourites, scheduled and search are filtered or sorted by something else.
 */
export function canReorder(
  view: Selection | 'search',
  openCount: number,
  sort: SortMode = 'manual',
): boolean {
  return (
    sort === 'manual' && (view === 'main' || selectedListId(view) !== undefined) && openCount > 1
  );
}

/** What a new intention takes on from the view it is added in. */
export interface NewTaskDefaults {
  listId?: string;
  starred?: boolean;
  due?: string;
}

export function newTaskDefaults(selection: Selection, today: string): NewTaskDefaults {
  const listId = selectedListId(selection);
  if (listId !== undefined) return { listId };
  if (selection === 'starred') return { starred: true };
  if (selection === 'scheduled' || selection === 'today') return { due: today };
  return {};
}
