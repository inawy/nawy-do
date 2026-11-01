import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'neutral' | 'primary' | 'danger' | 'dangerSolid' | 'text';

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-1.5 rounded-pill border disabled:cursor-default disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  neutral: 'border-line bg-transparent px-4 text-ink',
  primary: 'border-brand bg-brand px-6 font-semibold text-on-brand',
  danger: 'border-transparent bg-transparent px-4 text-danger',
  dangerSolid: 'border-danger bg-danger px-4 text-on-brand',
  text: 'border-transparent bg-transparent px-4 font-semibold text-brand',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** A pill button, ≥48dp tall. `type` defaults to "button" so a stray one never submits a form. */
export function Button({ variant = 'neutral', type = 'button', className = '', ...rest }: Props) {
  return <button type={type} className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest} />;
}
