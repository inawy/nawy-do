import { useEffect, useRef, type RefObject } from 'react';

const LOCK = 8; // px of travel that decides "swipe" or "scroll"
const IGNORE = 'input, textarea, select, [data-no-press], [role="dialog"]';
const OUT_MS = 140;
const IN_MS = 190;

interface Options {
  /** Whether a neighbour exists in that direction (1 = next, -1 = previous). */
  canStep: (delta: 1 | -1) => boolean;
  onStep: (delta: 1 | -1) => void;
  enabled: boolean;
}

/**
 * The content follows the finger, like a pager: let go past a quarter of the width (or with a
 * quick flick) and the page slides out and the neighbouring list slides in; otherwise it springs
 * back. Direction-aware (in RTL the next list is to the left). Touch only. The motion is written
 * straight to the element, so dragging never re-renders React.
 */
export function usePageSwipe(el: RefObject<HTMLElement | null>, opts: Options) {
  const latest = useRef(opts);
  latest.current = opts;

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let s: { x: number; y: number; t: number; id: number; drag: boolean } | null = null;
    let busy = false;
    const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;
    const rtl = () => getComputedStyle(node).direction === 'rtl';
    const forward = (dx: number): 1 | -1 => ((rtl() ? dx > 0 : dx < 0) ? 1 : -1);
    const reset = (ms: number) => {
      node.style.transition = ms ? `transform ${ms}ms ease-out, opacity ${ms}ms` : 'none';
      node.style.transform = '';
      node.style.opacity = '';
      window.setTimeout(() => (node.style.transition = ''), ms);
    };

    const down = (e: PointerEvent) => {
      if (!latest.current.enabled || busy || e.pointerType === 'mouse') return;
      if ((e.target as Element).closest(IGNORE)) return;
      s = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId, drag: false };
    };
    const move = (e: PointerEvent) => {
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (!s.drag) {
        if (Math.abs(dy) > LOCK && Math.abs(dy) > Math.abs(dx))
          s = null; // a scroll
        else if (Math.abs(dx) > LOCK) {
          s.drag = true;
          try {
            node.setPointerCapture?.(e.pointerId);
          } catch {
            /* a synthetic pointer has nothing to capture */
          }
          node.style.transition = 'none';
        }
        return;
      }
      const ok = latest.current.canStep(forward(dx));
      const shown = ok ? dx : dx * 0.25; // resistance where there is no neighbour
      node.style.transform = `translateX(${shown}px)`;
      node.style.opacity = String(1 - Math.min(Math.abs(shown) / node.offsetWidth, 1) * 0.5);
    };
    const swallow = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
    };
    const up = (e: PointerEvent) => {
      const cur = s;
      s = null;
      if (!cur?.drag || cur.id !== e.pointerId) return;
      const dx = e.clientX - cur.x;
      const velocity = Math.abs(dx) / Math.max(e.timeStamp - cur.t, 1);
      const delta = forward(dx);
      const far = Math.abs(dx) > node.offsetWidth * 0.25 || (velocity > 0.5 && Math.abs(dx) > 30);
      // The release must not also click whatever is under the finger.
      node.addEventListener('click', swallow, { capture: true, once: true });
      window.setTimeout(() => node.removeEventListener('click', swallow, true), 50);
      if (!far || !latest.current.canStep(delta)) return reset(reduced() ? 0 : IN_MS);
      if (reduced()) {
        reset(0);
        latest.current.onStep(delta);
        return;
      }
      busy = true;
      const sign = dx > 0 ? 1 : -1;
      node.style.transition = `transform ${OUT_MS}ms ease-in, opacity ${OUT_MS}ms`;
      node.style.transform = `translateX(${sign * node.offsetWidth * 0.6}px)`;
      node.style.opacity = '0';
      window.setTimeout(() => {
        latest.current.onStep(delta); // new list renders while the page is off to the side
        node.style.transition = 'none';
        node.style.transform = `translateX(${-sign * 48}px)`;
        node.style.opacity = '0';
        void node.offsetWidth; // commit that start position before animating from it
        reset(IN_MS);
        window.setTimeout(() => (busy = false), IN_MS);
      }, OUT_MS);
    };
    const cancel = () => {
      if (s?.drag) reset(IN_MS);
      s = null;
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', cancel);
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
    };
  }, [el]);
}
