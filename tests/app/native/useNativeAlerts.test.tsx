import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '@/core/model';
import { localTimeMs } from '@/app/clock';
import { isNativeApp } from '@/app/native/env';
import type { AlertScheduler, NativePermission } from '@/app/native/scheduler';
import { useNativeAlerts } from '@/app/native/useNativeAlerts';

const now = () => localTimeMs('2026-11-20', '10:00');
const tasks = [
  { id: 'a', status: 'open', title: 'x', due: '2026-11-20', dueTime: '11:00' },
] as unknown as Task[];

function fake(state: NativePermission) {
  const s = {
    permission: vi.fn((ask: boolean) =>
      Promise.resolve(ask && state === 'prompt' ? ('granted' as const) : state),
    ),
    replaceAll: vi.fn(() => Promise.resolve()),
  };
  return s satisfies AlertScheduler;
}

describe('useNativeAlerts', () => {
  it('does nothing in a browser', () => {
    const { result } = renderHook(() => useNativeAlerts(undefined, tasks, now));
    expect(result.current).toBeUndefined();
  });
  it('schedules the plan once permission is granted', async () => {
    const s = fake('granted');
    const { result } = renderHook(() => useNativeAlerts(s, tasks, now));
    await act(async () => {});
    expect(s.replaceAll).toHaveBeenCalledOnce();
    expect(s.replaceAll.mock.calls[0]?.[0]).toHaveLength(1);
    expect(result.current).toBeUndefined();
  });
  it('offers to ask while undecided, then schedules', async () => {
    const s = fake('prompt');
    const { result } = renderHook(() => useNativeAlerts(s, tasks, now));
    await act(async () => {});
    expect(s.replaceAll).not.toHaveBeenCalled();
    await act(async () => result.current?.());
    expect(s.replaceAll).toHaveBeenCalledOnce();
  });
  it('schedules nothing when refused', async () => {
    const s = fake('denied');
    renderHook(() => useNativeAlerts(s, tasks, now));
    await act(async () => {});
    expect(s.replaceAll).not.toHaveBeenCalled();
  });
});

describe('isNativeApp', () => {
  it('is false in a browser, true with Capacitor or the bridge', () => {
    expect(isNativeApp()).toBe(false);
    const w = window as unknown as Record<string, unknown>;
    w.Capacitor = { isNativePlatform: () => true };
    expect(isNativeApp()).toBe(true);
    delete w.Capacitor;
    w.androidBridge = {};
    expect(isNativeApp()).toBe(true);
    delete w.androidBridge;
  });
});
