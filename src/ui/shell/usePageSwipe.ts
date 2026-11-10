import { useRef, type PointerEvent } from 'react';

const START = 12; // px of horizontal travel before it counts as a swipe
const COMMIT = 64; // px past which releasing changes the page
const IGNORE = 'input, textarea, select, [data-no-press], [role="dialog"]';

/**
 * Swiping the content sideways moves to the neighbouring list (touch only; a mouse never swipes).
 * Direction-aware: in RTL, dragging to the right reveals the next list (they lie to the left).
 * Vertical movement cancels it first, so scrolling is never fought.
 */
export function usePageSwipe(onStep: (delta: 1 | -1) => void, enabled: boolean) {
  const t = useRef<{ x: number; y: number; on: boolean; id: number } | null>(null);
  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (!enabled || e.pointerType === 'mouse') return;
      if ((e.target as Element).closest(IGNORE)) return;
      t.current = { x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const s = t.current;
      if (!s || s.id !== e.pointerId || s.on) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dy) > START && Math.abs(dy) > Math.abs(dx))
        t.current = null; // a scroll
      else if (Math.abs(dx) > START && Math.abs(dx) > Math.abs(dy) * 1.5) s.on = true;
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      const s = t.current;
      t.current = null;
      if (!s?.on || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      if (Math.abs(dx) < COMMIT) return;
      const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
      onStep((rtl ? dx > 0 : dx < 0) ? 1 : -1);
    },
    onPointerCancel() {
      t.current = null;
    },
  };
}
