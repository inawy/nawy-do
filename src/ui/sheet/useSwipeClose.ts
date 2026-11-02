import { useRef, type PointerEvent } from 'react';

const CLOSE_DISTANCE = 120;
const CLOSE_FAST_DISTANCE = 40;
const CLOSE_VELOCITY = 0.6; // px per ms

/**
 * Drag-down-to-close for a bottom sheet. The drag starts on a grab handle only (never on the
 * scrolling content, so it cannot fight scrolling). The close button stays as the non-gesture way.
 */
export function useSwipeClose(onClose: () => void) {
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y0: number; t0: number; dy: number } | null>(null);

  const grab = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      drag.current = { y0: e.clientY, t0: e.timeStamp, dy: 0 };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Capture is an optimisation; the drag still works without it.
      }
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const d = drag.current;
      const el = sheet.current;
      if (!d || !el) return;
      d.dy = Math.max(0, e.clientY - d.y0);
      el.style.transition = 'none';
      el.style.transform = `translateY(${d.dy}px)`;
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      const d = drag.current;
      const el = sheet.current;
      drag.current = null;
      if (!d || !el) return;
      const velocity = d.dy / Math.max(1, e.timeStamp - d.t0);
      if (d.dy > CLOSE_DISTANCE || (d.dy > CLOSE_FAST_DISTANCE && velocity > CLOSE_VELOCITY)) {
        onClose();
        return;
      }
      el.style.transition = 'transform var(--nawy-duration-normal) var(--nawy-ease-standard)';
      el.style.transform = '';
    },
  };
  return { sheet, grab: { ...grab, onPointerCancel: grab.onPointerUp } };
}
