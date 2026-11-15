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

/**
 * Desktop keyboard shortcuts: N adds a task, / searches. They stay out of the way while typing,
 * with a modifier held, or while a sheet is open.
 */
export function useShortcuts({ onNew, onSearch }: Actions): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      if (typing(document.activeElement) || document.querySelector('[role="dialog"]')) return;
      const key = e.key.toLowerCase();
      // `ن` is the Arabic keyboard's letter on the same key as N.
      if (key === 'n' || key === 'ن') {
        e.preventDefault();
        onNew();
      } else if (e.key === '/' || e.key === 'ظ') {
        e.preventDefault();
        onSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNew, onSearch]);
}
