import { selectedListId, type Selection } from './selection';
import type { TaskList } from './types';

// What each view means. These are product rules, so they live in the core, testable without a UI.

/** A list that no longer exists (deleted here or elsewhere) falls back to the main list. */
export function resolveSelection(selection: Selection, lists: readonly TaskList[]): Selection {
  const id = selectedListId(selection);
  return id !== undefined && !lists.some((l) => l.id === id && l.deletedAt === undefined)
    ? 'main'
    : selection;
}

/**
 * Only the main list and a single list can be re-ordered: each shows all of its open tasks, so a
 * move is unambiguous. Favourites, scheduled and search are filtered or sorted by something else.
 */
export function canReorder(view: Selection | 'search', openCount: number): boolean {
  return (view === 'main' || selectedListId(view) !== undefined) && openCount > 1;
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
  if (selection === 'scheduled') return { due: today };
  return {};
}
