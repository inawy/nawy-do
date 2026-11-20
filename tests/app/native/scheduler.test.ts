import { beforeEach, describe, expect, it, vi } from 'vitest';

const plugin = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  getPending: vi.fn(),
  cancel: vi.fn(() => Promise.resolve()),
  createChannel: vi.fn(() => Promise.resolve()),
  schedule: vi.fn(() => Promise.resolve()),
}));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));

import { capacitorScheduler } from '@/app/native/scheduler';

beforeEach(() => vi.clearAllMocks());

describe('capacitorScheduler', () => {
  it('asks only when undecided and told to', async () => {
    const s = capacitorScheduler('ناوي دو');
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    expect(await s.permission(false)).toBe('prompt');
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    plugin.requestPermissions.mockResolvedValue({ display: 'granted' });
    expect(await s.permission(true)).toBe('granted');
    plugin.checkPermissions.mockResolvedValue({ display: 'denied' });
    expect(await s.permission(true)).toBe('denied');
  });
  it('replaces what the phone holds with the plan', async () => {
    plugin.getPending.mockResolvedValue({ notifications: [{ id: 9 }] });
    await capacitorScheduler('ناوي دو').replaceAll([
      { id: 1, taskId: 'a', atMs: 5000, title: 'خبز' },
    ]);
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: 9 }] });
    const sent = (
      plugin.schedule.mock.calls[0] as unknown as [
        { notifications: { id: number; body: string }[] },
      ]
    )[0];
    expect(sent.notifications[0]).toMatchObject({ id: 1, body: 'خبز' });
  });
  it('only cancels when the plan is empty', async () => {
    plugin.getPending.mockResolvedValue({ notifications: [] });
    await capacitorScheduler('x').replaceAll([]);
    expect(plugin.cancel).not.toHaveBeenCalled();
    expect(plugin.schedule).not.toHaveBeenCalled();
  });
});
