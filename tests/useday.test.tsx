import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDay } from '@/app/useDay';

afterEach(() => vi.useRealTimers());

describe('useDay', () => {
  it('moves to the new day at midnight without a reload', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 5, 23, 59, 30));
    let current = '2026-11-05';
    const { result } = renderHook(() =>
      useDay(
        () => current,
        () => Date.now(),
      ),
    );
    expect(result.current).toBe('2026-11-05');
    current = '2026-11-06';
    act(() => {
      vi.advanceTimersByTime(40_000);
    });
    expect(result.current).toBe('2026-11-06');
  });

  it('re-checks when the page comes back to the foreground', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 5, 12, 0, 0));
    let current = '2026-11-05';
    const { result } = renderHook(() =>
      useDay(
        () => current,
        () => Date.now(),
      ),
    );
    current = '2026-11-06';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('2026-11-06');
  });
});
