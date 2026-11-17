import { useEffect } from 'react';

interface Actions {
  /** «N»: a new task. */
  onNew: () => void;
  /** «/»: search. */
  onSearch: () => void;
}

const typing = (el: Element | null): boolean =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** The part of a row that holds focus: the circle, the title button or the star. */
const PARTS = ['.circle', '.body', '.star'] as const;

/**
 * Up/Down moves focus to the previous/next row, staying on the same part of it (so the circle
 * stays the circle). Only acts when focus is already in a row, so page scrolling is untouched,
 * and never on the drag handle, whose arrows belong to the keyboard sorter.
 */
function moveRow(step: 1 | -1): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active.closest('.grip')) return false;
  const row = active.closest('li.row');
  if (!row) return false;
  const rows = Array.from(document.querySelectorAll('li.row:not(.leaving)'));
  const next = rows[rows.indexOf(row) + step];
  if (!next) return false;
  const part = PARTS.find((p) => active.matches(p)) ?? '.body';
  const target = next.querySelector<HTMLElement>(part) ?? next.querySelector<HTMLElement>('.body');
  if (!target) return false;
  target.focus();
  return true;
}

/** «Ctrl+Z»: press the visible «undo» of the deletion toast, if there is one. */
function undoLast(): boolean {
  const button = document.querySelector<HTMLButtonElement>('.toast button');
  button?.click();
  return button !== null;
}

/**
 * Desktop keyboard shortcuts: N adds a task, / searches, Ctrl+Z undoes the last deletion and
 * Up/Down walk the rows (Space then completes, Enter opens, as on any focused control). They stay
 * out of the way while typing or while a sheet is open.
 */
export function useShortcuts({ onNew, onSearch }: Actions): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey) return;
      if (typing(document.activeElement) || document.querySelector('[role="dialog"]')) return;
      if (e.ctrlKey || e.metaKey) {
        // Latin «Z» only: with an Arabic layout the browser reports the Arabic letter, so no undo.
        if (e.key.toLowerCase() === 'z' && !e.shiftKey && undoLast()) e.preventDefault();
        return;
      }
      const key = e.key.toLowerCase();
      // `ن` is the Arabic keyboard's letter on the same key as N.
      if (key === 'n' || key === 'ن') {
        e.preventDefault();
        onNew();
      } else if (e.key === '/' || e.key === 'ظ') {
        e.preventDefault();
        onSearch();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (moveRow(e.key === 'ArrowDown' ? 1 : -1)) e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNew, onSearch]);
}
