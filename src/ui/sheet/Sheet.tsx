import { useEffect, type FormEvent, type ReactNode } from 'react';
import { useBackClose } from './useBackClose';
import { useFocusTrap } from './useFocusTrap';
import { useSwipeClose } from './useSwipeClose';

interface Props {
  /** Accessible name of the dialog. */
  label: string;
  onClose: () => void;
  /** When given, the content is a `<form>` and this is its submit handler (default prevented). */
  onSubmit?: () => void;
  children: ReactNode;
}

/**
 * The one bottom sheet (a centred card on wide screens). Closes on backdrop tap, Escape, the
 * system Back button, or a drag down from the handle.
 */
export function Sheet({ label, onClose, onSubmit, children }: Props) {
  useBackClose(onClose);
  const { sheet, grab } = useSwipeClose(onClose);
  const trap = useFocusTrap<HTMLDivElement>();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const body = onSubmit ? (
    <form
      className="grid gap-3"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  ) : (
    <div className="grid gap-3">{children}</div>
  );

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        ref={(node) => {
          sheet.current = node;
          trap.ref.current = node;
        }}
        className="sheet"
        tabIndex={-1}
        onKeyDown={trap.onKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grab" aria-hidden="true" {...grab}>
          <span />
        </div>
        {body}
      </div>
    </div>
  );
}
