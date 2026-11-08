import { useState } from 'react';

/** A list sheet: creating a new one, or the options of an existing one. */
export type ListSheetState = { mode: 'create' } | { mode: 'edit'; id: string } | null;

/**
 * The screen's own transient state: which sheet is open, the search text, the picked tasks.
 * Search and selection are mutually exclusive, and both are cleared when the view changes
 * (a pick never crosses views).
 */
export function useScreenState(startAdding = false) {
  const [sheet, setSheet] = useState<ListSheetState>(null);
  const [dataOpen, setDataOpen] = useState(false);
  const [adding, setAdding] = useState(startAdding);
  // `null` is off. While on, results come from ALL tasks, not just the current view.
  const [query, setQuery] = useState<string | null>(null);
  const [picked, setPicked] = useState<ReadonlySet<string> | null>(null);

  return {
    sheet,
    setSheet,
    dataOpen,
    setDataOpen,
    adding,
    setAdding,
    query,
    searching: query !== null && query.trim() !== '',
    picked,
    toggleSearch: () => setQuery((q) => (q === null ? '' : null)),
    setQuery,
    toggleSelecting: () => {
      setQuery(null);
      setPicked((cur) => (cur ? null : new Set()));
    },
    stopSelecting: () => setPicked(null),
    /** Long press on a row: selection starts with that row picked (search is left). */
    startSelecting: (id: string) => {
      setQuery(null);
      setPicked(new Set([id]));
    },
    pick: (id: string) =>
      setPicked((cur) => {
        const next = new Set(cur);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    /** The view changed: leave search and selection. */
    reset: () => {
      setPicked(null);
      setQuery(null);
    },
  };
}

export type ScreenState = ReturnType<typeof useScreenState>;
