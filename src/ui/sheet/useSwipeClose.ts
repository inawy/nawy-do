import { useEffect, useRef, type PointerEvent } from 'react';

const CLOSE_DISTANCE = 120;
const CLOSE_FAST_DISTANCE = 40;
const CLOSE_VELOCITY = 0.6; // px per ms
const TAKE_OVER = 6; // px of travel before a touch is read as a sheet gesture or a scroll
const SKIP = 'input, textarea, select, [contenteditable]';
const OUT_MS = 180;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;

/** True when nothing under the finger (up to the sheet) is scrolled away from its top. */
function atTop(from: Element | null, sheet: HTMLElement): boolean {
  for (let el = from; el; el = el.parentElement) {
    if (el.scrollTop > 0) return false;
    if (el === sheet) break;
  }
  return true;
}

/**
 * Closing a bottom sheet by hand. A touch anywhere on the sheet can swipe it away: down (when its
 * content is at the top, so scrolling is never fought), or sideways either way. The sheet follows
 * the finger, the backdrop fades with it, and a quick flick or a long enough drag closes it;
 * anything less springs back. The handle also works with a mouse. The close button stays as the
 * non-gesture way. Motion is written straight to the elements, so dragging never re-renders.
 */
export function useSwipeClose(onClose: () => void) {
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y0: number; t0: number; dy: number } | null>(null);
  const latest = useRef(onClose);
  latest.current = onClose;

  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const backdrop = el.parentElement;
    let s: {
      x: number;
      y: number;
      t: number;
      axis: 'x' | 'y' | null;
      skip: boolean;
      d: number;
      v: number;
      lastD: number;
      lastT: number;
    } | null = null;
    let closing = false;

    const show = (d: number, axis: 'x' | 'y') => {
      el.style.transition = 'none';
      el.style.transform = axis === 'y' ? `translateY(${d}px)` : `translateX(${d}px)`;
      const size = axis === 'y' ? el.offsetHeight : el.offsetWidth;
      if (backdrop) backdrop.style.opacity = String(1 - Math.min(Math.abs(d) / size, 1) * 0.8);
    };
    const settle = () => {
      el.style.transition = `transform ${OUT_MS}ms cubic-bezier(0.2, 0, 0, 1)`;
      el.style.transform = '';
      if (backdrop) {
        backdrop.style.transition = `opacity ${OUT_MS}ms`;
        backdrop.style.opacity = '';
      }
    };
    const dismiss = (axis: 'x' | 'y', sign: 1 | -1) => {
      closing = true;
      if (reducedMotion()) return latest.current();
      el.style.transition = `transform ${OUT_MS}ms ease-in`;
      el.style.transform = axis === 'y' ? 'translateY(110%)' : `translateX(${sign * 110}%)`;
      if (backdrop) {
        backdrop.style.transition = `opacity ${OUT_MS}ms`;
        backdrop.style.opacity = '0';
      }
      window.setTimeout(() => latest.current(), OUT_MS - 20);
    };

    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      if (closing || e.touches.length !== 1 || !t) return;
      const target = e.target as Element;
      s = {
        x: t.clientX,
        y: t.clientY,
        t: e.timeStamp,
        axis: null,
        skip: target.closest(SKIP) !== null && target.closest('.sheet-grab') === null,
        d: 0,
        v: 0,
        lastD: 0,
        lastT: e.timeStamp,
      };
    };
    const move = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!s || !t || closing) return;
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (s.axis === null) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < TAKE_OVER) return;
        const horizontal = Math.abs(dx) > Math.abs(dy);
        const downFromTop = !horizontal && dy > 0 && atTop(e.target as Element, el);
        if (s.skip || (!horizontal && !downFromTop)) {
          s = null; // a scroll (or typing): the browser's
          return;
        }
        s.axis = horizontal ? 'x' : 'y';
      }
      if (e.cancelable) e.preventDefault();
      const d = s.axis === 'x' ? dx : Math.max(0, dy);
      const dt = e.timeStamp - s.lastT;
      if (dt > 0) s.v = (d - s.lastD) / dt;
      s.lastD = d;
      s.lastT = e.timeStamp;
      s.d = d;
      show(d, s.axis);
    };
    const end = () => {
      const cur = s;
      s = null;
      if (!cur?.axis || closing) return;
      const dist = Math.abs(cur.d);
      const size = cur.axis === 'y' ? el.offsetHeight : el.offsetWidth;
      const speed = Math.abs(cur.v);
      const flick =
        speed > CLOSE_VELOCITY &&
        dist > CLOSE_FAST_DISTANCE &&
        Math.sign(cur.v) === Math.sign(cur.d);
      if (dist > Math.max(CLOSE_DISTANCE, size * 0.35) || flick) {
        dismiss(cur.axis, cur.d < 0 ? -1 : 1);
      } else {
        settle();
      }
    };

    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, []);

  // The handle with a mouse (a touch on it is the gesture above).
  const grab = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (e.pointerType === 'touch') return;
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
        latest.current();
        return;
      }
      el.style.transition = 'transform var(--nawy-duration-normal) var(--nawy-ease-standard)';
      el.style.transform = '';
    },
  };
  return { sheet, grab: { ...grab, onPointerCancel: grab.onPointerUp } };
}
