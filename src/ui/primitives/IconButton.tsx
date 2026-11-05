import type { ButtonHTMLAttributes } from 'react';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required: an icon has no text, so this is its accessible name. */
  label: string;
}

/** A round 48dp icon-only button. */
export function IconButton({ label, type = 'button', className = '', ...rest }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`grid size-12 flex-none place-items-center rounded-full border-0 bg-transparent text-muted hover:bg-hover disabled:pointer-events-none disabled:opacity-40 ${className}`}
      {...rest}
    />
  );
}
