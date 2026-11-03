import { useEffect, useRef } from 'react';

/** The attribute that marks a navigation item as a place a row can be dropped on. */
const ATTR = 'data-drop-list';
const OVER = 'data-drop-over';

/** The drop target under a screen point: the topmost element with `data-drop-list`. */
function targetAt(x: number, y: number): HTMLElement | undefined {
  for (const el of document.elementsFromPoint(x, y)) {
    const hit = el.closest<HTMLElement>(`[${ATTR}]`);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * While a row is dragged, follows the pointer, highlights the navigation item under it
 * (`data-drop-over`) and, on `stop()`, returns that item's target (or undefined). The library moves
 * the row; this only answers «is the pointer over a list in the navigation?».
 */
export function useDropTargets() {
  const cleanup = useRef<(() => void) | null>(null);
  const last = useRef<string | undefined>(undefined);

  const stop = (): string | undefined => {
    cleanup.current?.();
    cleanup.current = null;
    const target = last.current;
    last.current = undefined;
    return target;
  };

  const start = () => {
    stop();
    const onMove = (e: PointerEvent) => {
      const hit = targetAt(e.clientX, e.clientY);
      last.current = hit?.getAttribute(ATTR) ?? undefined;
      document.querySelectorAll(`[${OVER}]`).forEach((el) => el.removeAttribute(OVER));
      hit?.setAttribute(OVER, '');
    };
    window.addEventListener('pointermove', onMove);
    cleanup.current = () => {
      window.removeEventListener('pointermove', onMove);
      document.querySelectorAll(`[${OVER}]`).forEach((el) => el.removeAttribute(OVER));
    };
  };

  useEffect(
    () => () => {
      stop();
    },
    [],
  );
  return { start, stop };
}
