import { useCallback, useEffect, useState } from 'react';
import type { Task } from '@/core/model';
import { planAlerts } from './plan';
import type { AlertScheduler, NativePermission } from './scheduler';

/**
 * In the Android app, keeps the phone's own alarms equal to the plan for the open tasks, so they
 * ring with the app closed. `scheduler` is undefined in a browser: then this does nothing. Returns
 * the function that asks for the permission while it is undecided, else `undefined`.
 */
export function useNativeAlerts(
  scheduler: AlertScheduler | undefined,
  tasks: readonly Task[],
  now: () => number,
): (() => void) | undefined {
  const [permission, setPermission] = useState<NativePermission | 'unknown'>('unknown');

  useEffect(() => {
    if (!scheduler) return;
    void scheduler.permission(false).then(setPermission, () => setPermission('denied'));
  }, [scheduler]);

  useEffect(() => {
    if (!scheduler || permission !== 'granted') return;
    // Not awaited by anything: a failure here must not break the list; the next change retries.
    void scheduler.replaceAll(planAlerts(tasks, now())).catch(() => undefined);
  }, [scheduler, permission, tasks, now]);

  const ask = useCallback(() => {
    if (scheduler) void scheduler.permission(true).then(setPermission, () => undefined);
  }, [scheduler]);
  return scheduler && permission === 'prompt' ? ask : undefined;
}
