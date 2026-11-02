import { useRef, type MouseEvent, type PointerEvent } from 'react';

const START_DISTANCE = 10; // px of horizontal travel before it counts as a swipe
const COMMIT_DISTANCE = 96; // px past which releasing performs the action
const LONG_PRESS_MS = 500;

interface Options {
  enabled: boolean;
  /** Swiped toward the end of the line (right in LTR, left in RTL): complete. */
  onComplete: () => void;
  /** Swiped toward the start of the line: delete (the app offers undo). */
  onRemove: () => void;
  /** Held still for half a second: start selecting with this row picked. */
  onLongPress?: () => void;
}

interface Track {
  x0: number;
  y0: number;
  active: boolean;
  dx: number;
  passed: boolean;
}

/**
 * Horizontal swipe on a row, direction-aware (RTL flips left/right). Vertical movement first
 * cancels it, so scrolling is never fought; the row keeps `touch-action: pan-y` for that. Every
 * swipe action also exists without a gesture (the circle, the details sheet).
 */
export function useRowSwipe({ enabled, onComplete, onRemove, onLongPress }: Options) {
  const slide = useRef<HTMLDivElement>(null);
  const track = useRef<Track | null>(null);
  const swallowClick = useRef(false);
  const timer = useRef(0);
  const stopTimer = () => window.clearTimeout(timer.current);

  const reset = (animate: boolean) => {
    const el = slide.current;
    if (!el) return;
    el.style.transition = animate
      ? 'transform var(--nawy-duration-normal) var(--nawy-ease-standard)'
      : 'none';
    el.style.transform = '';
    el.style.userSelect = '';
    delete el.parentElement?.dataset.swipe;
  };

  const handlers = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (!enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      track.current = { x0: e.clientX, y0: e.clientY, active: false, dx: 0, passed: false };
      stopTimer();
      if (onLongPress) {
        timer.current = window.setTimeout(() => {
          track.current = null;
          swallowClick.current = true;
          navigator.vibrate?.(15);
          onLongPress();
        }, LONG_PRESS_MS);
      }
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const t = track.current;
      const el = slide.current;
      if (!t || !el) return;
      const dx = e.clientX - t.x0;
      const dy = e.clientY - t.y0;
      if (Math.abs(dx) > START_DISTANCE || Math.abs(dy) > START_DISTANCE) stopTimer();
      if (!t.active) {
        if (Math.abs(dy) > START_DISTANCE && Math.abs(dy) > Math.abs(dx)) {
          track.current = null; // a scroll, not a swipe
          return;
        }
        if (Math.abs(dx) < START_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        t.active = true;
        el.style.userSelect = 'none';
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Capture is an optimisation; the swipe still works without it.
        }
      }
      t.dx = dx;
      el.style.transition = 'none';
      el.style.transform = `translateX(${dx}px)`;
      const rtl = getComputedStyle(el).direction === 'rtl';
      const toEnd = (rtl ? -dx : dx) > 0;
      if (el.parentElement) el.parentElement.dataset.swipe = toEnd ? 'complete' : 'delete';
      const passed = Math.abs(dx) > COMMIT_DISTANCE;
      if (passed && !t.passed) navigator.vibrate?.(10);
      t.passed = passed;
    },
    onPointerUp() {
      stopTimer();
      const t = track.current;
      const el = slide.current;
      track.current = null;
      if (!t?.active || !el) return;
      swallowClick.current = true;
      const rtl = getComputedStyle(el).direction === 'rtl';
      const toEnd = (rtl ? -t.dx : t.dx) > 0;
      reset(true);
      if (Math.abs(t.dx) > COMMIT_DISTANCE) (toEnd ? onComplete : onRemove)();
    },
    onPointerCancel() {
      stopTimer();
      const t = track.current;
      track.current = null;
      if (t?.active) reset(true);
    },
    // A long press must not open the system's text menu.
    onContextMenu(e: MouseEvent<HTMLElement>) {
      if (onLongPress) e.preventDefault();
    },
    // The release of a swipe must not also "click" the text under the finger.
    onClickCapture(e: MouseEvent<HTMLElement>) {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
  return { slide, handlers };
}
