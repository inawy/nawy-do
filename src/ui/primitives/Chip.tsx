import type { ButtonHTMLAttributes } from 'react';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'aria-pressed'> {
  /** Present for a toggle chip (then `aria-pressed` is set); omit for a plain action chip. */
  pressed?: boolean;
}

/** A pill-shaped choice, ≥48dp tall. First module migrated to Tailwind (token-based utilities). */
export function Chip({ pressed, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`min-h-12 rounded-pill border border-line bg-surface px-4 text-ink aria-pressed:border-brand aria-pressed:bg-soft aria-pressed:font-semibold aria-pressed:text-brand disabled:cursor-default disabled:text-muted ${className}`}
      {...rest}
    />
  );
}
