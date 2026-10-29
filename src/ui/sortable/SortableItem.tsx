import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

/** What a row needs to take part in a sortable list. */
export interface SortState {
  rowRef: (el: HTMLElement | null) => void;
  style: CSSProperties;
  /** Spread on the drag handle button. */
  handle: HTMLAttributes<HTMLButtonElement> & { ref: (el: HTMLElement | null) => void };
  dragging: boolean;
}

/** Connects one row to its `SortableList`; renders whatever `children` returns with the state. */
export function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (sort: SortState) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return children({
    rowRef: setNodeRef,
    style: { transform: CSS.Transform.toString(transform), transition },
    handle: { ref: setActivatorNodeRef, ...attributes, ...listeners },
    dragging: isDragging,
  });
}
