import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task } from '@/core/model';
import { localTimeMs } from './clock';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A minute that has just passed still rings (the app was opened or woke up right then). */
const GRACE_MS = 60 * 1000;

const supported = (): boolean => typeof Notification !== 'undefined';

/** The open tasks that fall due at a set time within the next 24 hours, with when to ring. */
export function dueSoon(tasks: readonly Task[], at: number): { task: Task; delay: number }[] {
  const out: { task: Task; delay: number }[] = [];
  for (const task of tasks) {
    if (task.status === 'done' || !task.due || !task.dueTime) continue;
    const delay = localTimeMs(task.due, task.dueTime) - (task.remindBefore ?? 0) * 60_000 - at;
    if (delay >= -GRACE_MS && delay <= DAY_MS) out.push({ task, delay: Math.max(0, delay) });
  }
  return out;
}

/** Android Chrome only allows notifications through the service worker; elsewhere `new` works. */
async function show(heading: string, task: Task): Promise<void> {
  const options = { body: task.title, tag: task.id, icon: '/icons/icon-192.png' };
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(heading, options);
  } catch {
    new Notification(heading, options);
  }
}

/**
 * While the app is open, shows a system notification when a task's time arrives (needs the
 * notification permission). Returns the function that asks for it, or `undefined` once it was
 * granted, refused, or if the browser has no notifications.
 */
export function useDueAlerts(
  tasks: readonly Task[],
  now: () => number,
  today: () => string,
  heading: string,
): (() => void) | undefined {
  const [permission, setPermission] = useState(() =>
    supported() ? Notification.permission : 'denied',
  );
  const fired = useRef(new Set<string>());
  const day = today();

  useEffect(() => {
    if (permission !== 'granted') return;
    const timers = dueSoon(tasks, now()).flatMap(({ task, delay }) => {
      const key = `${task.id}|${task.due}|${task.dueTime}|${task.remindBefore ?? 0}`;
      if (fired.current.has(key)) return [];
      return [
        window.setTimeout(() => {
          fired.current.add(key);
          void show(heading, task);
        }, delay),
      ];
    });
    return () => timers.forEach((id) => window.clearTimeout(id));
    // `day` re-plans after midnight, when the next day's alerts come into the 24-hour window.
  }, [tasks, permission, heading, now, day]);

  const ask = useCallback(() => {
    void Notification.requestPermission().then(setPermission);
  }, []);
  return permission === 'default' ? ask : undefined;
}
