import { useEffect, type RefObject } from 'react';

const TAKE_OVER = 6;
const OUT_MS = 180;
const CLOSE_VELOCITY = 0.5; // px per ms
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;

/**
 * The side menu closes by swiping it towards the edge it came from (left in English, right in
 * Arabic), anywhere on it or on the dimmed area. It follows the finger and the dimming fades;
 * a long enough drag or a quick flick closes it, anything less springs back. Vertical movement is
 * left to scrolling. Written straight to the elements, so dragging never re-renders.
 */
export function useDrawerSwipe(drawer: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const el = drawer.current;
    const surface = el?.parentElement;
    if (!el || !surface) return;
    const sign = getComputedStyle(el).direction === 'rtl' ? 1 : -1; // the closing direction of dx
    let s: {
      x: number;
      y: number;
      on: boolean;
      d: number;
      v: number;
      lastT: number;
      lastD: number;
    } | null = null;
    let closing = false;

    const show = (d: number) => {
      el.style.transition = 'none';
      el.style.animation = 'none';
      el.style.transform = `translateX(${sign * d}px)`;
      surface.style.opacity = String(1 - Math.min(d / el.offsetWidth, 1) * 0.8);
    };
    const settle = () => {
      el.style.transition = `transform ${OUT_MS}ms cubic-bezier(0.2, 0, 0, 1)`;
      el.style.transform = '';
      surface.style.transition = `opacity ${OUT_MS}ms`;
      surface.style.opacity = '';
    };
    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      if (closing || e.touches.length !== 1 || !t) return;
      s = { x: t.clientX, y: t.clientY, on: false, d: 0, v: 0, lastT: e.timeStamp, lastD: 0 };
    };
    const move = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!s || !t || closing) return;
      const dx = (t.clientX - s.x) * sign; // positive = towards the edge
      const dy = t.clientY - s.y;
      if (!s.on) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < TAKE_OVER) return;
        if (dx <= 0 || Math.abs(dy) > Math.abs(dx)) {
          s = null; // a scroll, or the wrong way: not ours
          return;
        }
        s.on = true;
      }
      if (e.cancelable) e.preventDefault();
      const d = Math.max(0, dx);
      const dt = e.timeStamp - s.lastT;
      if (dt > 0) s.v = (d - s.lastD) / dt;
      s.lastD = d;
      s.lastT = e.timeStamp;
      s.d = d;
      show(d);
    };
    const end = () => {
      const cur = s;
      s = null;
      if (!cur?.on || closing) return;
      if (cur.d > el.offsetWidth * 0.35 || (cur.v > CLOSE_VELOCITY && cur.d > 40)) {
        closing = true;
        if (reducedMotion()) return onClose();
        el.style.transition = `transform ${OUT_MS}ms ease-in`;
        el.style.transform = `translateX(${sign * 110}%)`;
        surface.style.transition = `opacity ${OUT_MS}ms`;
        surface.style.opacity = '0';
        window.setTimeout(onClose, OUT_MS - 20);
      } else {
        settle();
      }
    };

    surface.addEventListener('touchstart', start, { passive: true });
    surface.addEventListener('touchmove', move, { passive: false });
    surface.addEventListener('touchend', end);
    surface.addEventListener('touchcancel', end);
    return () => {
      surface.removeEventListener('touchstart', start);
      surface.removeEventListener('touchmove', move);
      surface.removeEventListener('touchend', end);
      surface.removeEventListener('touchcancel', end);
    };
  }, [drawer, onClose]);
}
