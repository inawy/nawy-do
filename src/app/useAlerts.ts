import { useMemo } from 'react';
import type { Task } from '@/core/model';
import { isNativeApp } from './native/env';
import { capacitorScheduler } from './native/scheduler';
import { useNativeAlerts } from './native/useNativeAlerts';
import { useDueAlerts } from './useDueAlerts';

/**
 * Due-time alerts: the phone's own alarms in the Android app (they ring with the app closed),
 * the browser's notifications while the page is open elsewhere. Returns what the menu offers.
 */
export function useAlerts(
  tasks: readonly Task[],
  now: () => number,
  today: () => string,
  title: string,
  native = isNativeApp(),
): (() => void) | undefined {
  const scheduler = useMemo(
    () => (native ? capacitorScheduler(title) : undefined),
    [native, title],
  );
  const web = useDueAlerts(tasks, now, today, title, !native);
  const phone = useNativeAlerts(scheduler, tasks, now);
  return native ? phone : web;
}
