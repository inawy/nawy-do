import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepsField } from '@/ui/details/StepsField';

const steps = [
  { id: 'a', title: 'أ', done: false },
  { id: 'a1', title: 'أ١', done: false, level: 1 as const },
  { id: 'b', title: 'ب', done: false },
];

describe('StepsField folding', () => {
  it('folds the nested steps of a parent and shows how many are hidden', () => {
    render(
      <StepsField steps={steps} onChange={vi.fn()} draft="" onDraft={vi.fn()} onAdd={vi.fn()} />,
    );
    expect(screen.getByRole('checkbox', { name: 'أ١' })).toBeTruthy();
    const fold = screen.getByRole('button', { name: /اطوِ الخطوات الفرعية: أ/ });
    expect(fold.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(fold);
    expect(screen.queryByRole('checkbox', { name: 'أ١' })).toBeNull();
    expect(
      screen.getByRole('button', { name: /افتح الخطوات الفرعية: أ/ }).getAttribute('aria-expanded'),
    ).toBe('false');
    // a step without nested steps has no fold button
    expect(screen.queryByRole('button', { name: /الخطوات الفرعية: ب/ })).toBeNull();
  });
});
