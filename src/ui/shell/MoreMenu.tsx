import { useEffect, useRef, useState } from 'react';
import { IconButton, MoreIcon } from '../primitives';

export interface MenuAction {
  label: string;
  onPick: () => void;
}

/** The "more" menu: secondary actions behind one 48dp button. Closes on pick, Escape or outside tap. */
export function MoreMenu({ actions }: { actions: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <span className="more" ref={root}>
      <IconButton
        label="المزيد"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreIcon />
      </IconButton>
      {open && (
        <div className="more-menu" role="menu">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                a.onPick();
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
