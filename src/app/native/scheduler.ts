import { dateOfMs } from '../clock';
import type { PlannedAlert } from './plan';

// The one place that talks to the phone's notification system (ADR 0045). The plugin is loaded only
// when asked, so the browser build never runs it.

export type NativePermission = 'granted' | 'denied' | 'prompt';

export interface AlertScheduler {
  /** The permission now; with `ask`, shows the system prompt first if it is still undecided. */
  permission(ask: boolean): Promise<NativePermission>;
  /** Makes these the only alerts the phone holds: cancels the rest, schedules these. */
  replaceAll(items: readonly PlannedAlert[]): Promise<void>;
}

const CHANNEL_ID = 'task-alerts';

export function capacitorScheduler(channelName: string): AlertScheduler {
  // The plugin object must never be what a promise resolves with: Capacitor's plugin proxy answers
  // any property, `then` included, so the await would call it and fail. Wrap it in a plain object.
  const plugin = async () => ({
    notifications: (await import('@capacitor/local-notifications')).LocalNotifications,
  });
  const permission = async (ask: boolean): Promise<NativePermission> => {
    const { notifications } = await plugin();
    let state = (await notifications.checkPermissions()).display;
    if (state !== 'granted' && state !== 'denied' && ask) {
      state = (await notifications.requestPermissions()).display;
    }
    return state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'prompt';
  };
  return {
    permission,
    async replaceAll(items) {
      const { notifications } = await plugin();
      const pending = await notifications.getPending();
      if (pending.notifications.length > 0) {
        await notifications.cancel({ notifications: pending.notifications });
      }
      if (items.length === 0) return;
      // Android 8+ files every notification in a channel; make ours loud enough to show on screen.
      await notifications.createChannel({
        id: CHANNEL_ID,
        name: channelName,
        description: '',
        importance: 4,
        visibility: 1,
        vibration: true,
      });
      await notifications.schedule({
        notifications: items.map((i) => ({
          id: i.id,
          title: channelName,
          body: i.title,
          channelId: CHANNEL_ID,
          schedule: { at: dateOfMs(i.atMs), allowWhileIdle: true },
        })),
      });
    },
  };
}
