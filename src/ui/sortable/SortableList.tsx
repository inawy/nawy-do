import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type ScreenReaderInstructions,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  /** Ids in their current display order. */
  ids: readonly string[];
  /** Called once, when a drop lands on a new slot (index in the list with the item moved). */
  onMove: (id: string, toIndex: number) => void;
  /** A human label for an id, used in screen-reader announcements. */
  describe: (id: string) => string;
  ariaLabel: string;
  /** Renders the items in the order given (which previews a drop until it is saved). */
  children: (orderedIds: string[]) => ReactNode;
}

const INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'للتحريك: اضغط مسافة لالتقاط النية، ثم استخدم الأسهم لتغيير مكانها، ومسافة للإفلات، أو Esc للإلغاء.',
};

/**
 * A vertical sortable list on dnd-kit: pointer and touch drag by a handle, keyboard (Space, arrows,
 * Space), auto-scroll and screen-reader announcements come from the library (D-018). This component
 * only adapts it to the app: Arabic announcements, and keeping the dropped order on screen until
 * the saved order arrives, so a row never jumps back and forth.
 */
export function SortableList({ ids, onMove, describe, ariaLabel, children }: Props) {
  const [preview, setPreview] = useState<string[] | null>(null);
  const idsKey = ids.join('\u0000');
  const timer = useRef(0);

  // The saved order has arrived (or the list changed for another reason): drop the preview.
  useEffect(() => {
    setPreview(null);
  }, [idsKey]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sensors = useSensors(
    // A few pixels of movement before a drag starts, so a tap on the handle is not a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const position = (id: string, list: readonly string[]) =>
    `المكان ${list.indexOf(id) + 1} من ${list.length}`;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `التقطت «${describe(String(active.id))}». ${position(String(active.id), ids)}.`,
    onDragOver: ({ active, over }) =>
      over ? `«${describe(String(active.id))}» فوق «${describe(String(over.id))}». ${position(String(over.id), ids)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `أفلتّ «${describe(String(active.id))}» في ${position(String(over.id), ids)}.`
        : `أفلتّ «${describe(String(active.id))}» في مكانها.`,
    onDragCancel: ({ active }) => `اتلغى تحريك «${describe(String(active.id))}».`,
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    setPreview(arrayMove([...ids], from, to));
    onMove(String(active.id), to);
    // Never keep a stale preview if the save fails or changes nothing.
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPreview(null), 2000);
  };

  const shown = preview ?? [...ids];
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions: INSTRUCTIONS }}
    >
      <SortableContext items={shown} strategy={verticalListSortingStrategy}>
        <ul className="list" aria-label={ariaLabel}>
          {children(shown)}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
