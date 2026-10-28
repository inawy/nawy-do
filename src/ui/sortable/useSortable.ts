import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

export interface SortableOptions {
  /** The ids in their current display order. */
  ids: readonly string[];
  enabled: boolean;
  /** Called once, when a drag ends on a new slot or a keyboard move happens. */
  onMove: (id: string, toIndex: number) => void;
}

interface DragState {
  id: string;
  /** Pointer offset inside the row at grab time. */
  grab: number;
  startIndex: number;
  index: number;
  pointerY: number;
  translate: number;
  pointerId: number;
}

const EDGE = 72;
const SCROLL_STEP = 14;

/**
 * Pointer-and-keyboard sortable list without a library. Rows are re-ordered live while one is
 * dragged by its handle; the dragged row follows the pointer with a transform. On release the
 * parent is told once (`onMove`). Alt+ArrowUp / Alt+ArrowDown on a handle moves by one slot.
 */
export function useSortable({ ids, enabled, onMove }: SortableOptions) {
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLElement>());
  const handles = useRef(new Map<string, HTMLElement>());
  const drag = useRef<DragState | null>(null);
  const orderRef = useRef<string[]>([]);
  const raf = useRef(0);
  const focusAfter = useRef<string | null>(null);
  const idsKey = ids.join('\u0000');

  const display = order ?? [...ids];
  orderRef.current = display;

  // The saved order has arrived (or anything else changed the list): drop the preview.
  useEffect(() => {
    if (!drag.current) setOrder(null);
  }, [idsKey]);

  useLayoutEffect(() => {
    if (focusAfter.current) {
      handles.current.get(focusAfter.current)?.focus();
      focusAfter.current = null;
    }
  }, [idsKey]);

  const applyTransform = useCallback(() => {
    const d = drag.current;
    const el = d && rows.current.get(d.id);
    if (!d || !el) return;
    const layoutTop = el.getBoundingClientRect().top - d.translate;
    d.translate = d.pointerY - d.grab - layoutTop;
    el.style.transform = `translateY(${d.translate}px)`;
  }, []);

  // After a live re-order the row's layout slot changed; keep it under the pointer.
  useLayoutEffect(() => {
    if (drag.current) applyTransform();
  }, [order, applyTransform]);

  const update = useCallback(() => {
    const d = drag.current;
    const el = d && rows.current.get(d.id);
    if (!d || !el) return;
    const height = el.getBoundingClientRect().height;
    const center = d.pointerY - d.grab + height / 2;
    const others = orderRef.current.filter((x) => x !== d.id);
    let index = 0;
    for (const id of others) {
      const r = rows.current.get(id)?.getBoundingClientRect();
      if (r && r.top + r.height / 2 < center) index++;
    }
    if (index !== d.index) {
      d.index = index;
      const next = [...others];
      next.splice(index, 0, d.id);
      setOrder(next);
    }
    applyTransform();
  }, [applyTransform]);

  const finish = useCallback(
    (commit: boolean) => {
      const d = drag.current;
      if (!d) return;
      cancelAnimationFrame(raf.current);
      const el = rows.current.get(d.id);
      if (el) el.style.transform = '';
      drag.current = null;
      setDragId(null);
      if (commit && d.index !== d.startIndex) {
        // Keep the previewed order until the saved one arrives, so the row does not jump back.
        onMove(d.id, d.index);
        window.setTimeout(() => setOrder(null), 1500);
      } else {
        setOrder(null);
      }
    },
    [onMove],
  );

  useEffect(() => {
    if (!dragId) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
    };
    document.addEventListener('keydown', onKey);
    const tick = () => {
      const d = drag.current;
      if (d) {
        const y = d.pointerY;
        const dy = y < EDGE ? -SCROLL_STEP : y > window.innerHeight - EDGE ? SCROLL_STEP : 0;
        if (dy !== 0) {
          window.scrollBy(0, dy);
          update();
        }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf.current);
    };
  }, [dragId, finish, update]);

  const registerRow = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) rows.current.set(id, el);
      else rows.current.delete(id);
    },
    [],
  );

  const handleProps = useCallback(
    (
      id: string,
    ): HTMLAttributes<HTMLButtonElement> & { ref: (el: HTMLButtonElement | null) => void } => ({
      ref: (el) => {
        if (el) handles.current.set(id, el);
        else handles.current.delete(id);
      },
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        if (!enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
        const row = rows.current.get(id);
        if (!row) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = row.getBoundingClientRect();
        drag.current = {
          id,
          grab: e.clientY - rect.top,
          startIndex: orderRef.current.indexOf(id),
          index: orderRef.current.indexOf(id),
          pointerY: e.clientY,
          translate: 0,
          pointerId: e.pointerId,
        };
        setOrder([...orderRef.current]);
        setDragId(id);
      },
      onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
        const d = drag.current;
        if (!d || d.pointerId !== e.pointerId) return;
        d.pointerY = e.clientY;
        update();
      },
      onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
        if (drag.current?.pointerId === e.pointerId) finish(true);
      },
      onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => {
        if (drag.current?.pointerId === e.pointerId) finish(false);
      },
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
        if (!enabled || !e.altKey) return;
        const from = orderRef.current.indexOf(id);
        const to = e.key === 'ArrowUp' ? from - 1 : e.key === 'ArrowDown' ? from + 1 : from;
        if (to === from || to < 0 || to >= orderRef.current.length) return;
        e.preventDefault();
        focusAfter.current = id;
        onMove(id, to);
      },
    }),
    [enabled, finish, onMove, update],
  );

  return { order: display, dragId, registerRow, handleProps };
}
