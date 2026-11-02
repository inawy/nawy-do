import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sheet } from '@/ui/sheet';

// Unmounting a sheet pops its history entry asynchronously; let that settle between tests.
afterEach(async () => {
  cleanup();
  await new Promise((r) => setTimeout(r, 50));
});

const open = (onClose = vi.fn(), onSubmit?: () => void) => {
  const props = onSubmit ? { onSubmit } : {};
  render(
    <Sheet label="تجربة" onClose={onClose} {...props}>
      <p>محتوى</p>
    </Sheet>,
  );
  return onClose;
};

describe('Sheet', () => {
  it('is a labelled modal dialog', () => {
    open();
    expect(screen.getByRole('dialog', { name: 'تجربة' }).getAttribute('aria-modal')).toBe('true');
  });

  it('closes on Escape and on a backdrop tap, but not on a tap inside', () => {
    const onClose = open();
    fireEvent.click(screen.getByText('محتوى'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes on the system Back button (popstate) and owns a history entry', () => {
    const onClose = open();
    expect(window.history.state).toEqual({ nawySheet: true });
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not push another history entry when the parent re-renders', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Sheet label="تجربة" onClose={onClose}>
        <p>محتوى</p>
      </Sheet>,
    );
    const len = window.history.length;
    rerender(
      <Sheet label="تجربة" onClose={() => onClose()}>
        <p>محتوى</p>
      </Sheet>,
    );
    expect(window.history.length).toBe(len);
  });

  it('submits through a form when onSubmit is given', () => {
    const onSubmit = vi.fn();
    render(
      <Sheet label="نموذج" onClose={vi.fn()} onSubmit={onSubmit}>
        <button type="submit">حفظ</button>
      </Sheet>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'حفظ' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
