import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUndoTrail } from '@/app/useUndoTrail';

type Props = { task: object | null; list: object | null };

describe('useUndoTrail', () => {
  const a = { n: 'task a' };
  const l = { n: 'list' };
  const b = { n: 'task b' };

  it('offers the newest deletion first, across tasks and lists', () => {
    const { result, rerender } = renderHook((p: Props) => useUndoTrail(p.task, p.list), {
      initialProps: { task: null, list: null } as Props,
    });
    expect(result.current.newest).toBeUndefined();
    rerender({ task: a, list: null });
    expect(result.current.newest).toBe('task');
    rerender({ task: a, list: l });
    expect(result.current.newest).toBe('list');
    rerender({ task: b, list: l });
    expect(result.current.newest).toBe('task');
    // Undoing task b brings task a's deletion back on top, then the list's.
    act(() => result.current.popped());
    rerender({ task: a, list: l });
    expect(result.current.newest).toBe('list');
    act(() => result.current.popped());
    rerender({ task: a, list: null });
    expect(result.current.newest).toBe('task');
  });

  it('hiding the toast keeps the deletions and a new deletion shows it again', () => {
    const { result, rerender } = renderHook((p: Props) => useUndoTrail(p.task, p.list), {
      initialProps: { task: a, list: null } as Props,
    });
    act(() => result.current.hide());
    expect(result.current.newest).toBeUndefined();
    rerender({ task: b, list: null });
    expect(result.current.newest).toBe('task');
  });
});
