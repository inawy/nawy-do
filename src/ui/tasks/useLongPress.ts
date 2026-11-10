import { useRef, type MouseEvent, type PointerEvent } from 'react';

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10; // px the finger may drift before it is a scroll, not a press

/**
 * Holding a row still for half a second starts selecting with that row picked. Moving first (a
 * scroll or a page swipe) cancels it. The release after a long press must not also «click» the text
 * under the finger, and the system's text menu must not open.
 */
export function useLongPress(onLongPress: (() => void) | undefined) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const timer = useRef(0);
  const swallowClick = useRef(false);
  const stop = () => {
    window.clearTimeout(timer.current);
    start.current = null;
  };

  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (!onLongPress || (e.pointerType === 'mouse' && e.button !== 0)) return;
      // A press on the re-order handle belongs to the drag library.
      if ((e.target as Element).closest('[data-no-press]')) return;
      start.current = { x: e.clientX, y: e.clientY };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        start.current = null;
        swallowClick.current = true;
        navigator.vibrate?.(15);
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const s = start.current;
      if (!s) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE) stop();
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onContextMenu(e: MouseEvent<HTMLElement>) {
      if (onLongPress) e.preventDefault();
    },
    onClickCapture(e: MouseEvent<HTMLElement>) {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}
