import { useEffect, useState } from 'react';
import { msUntilLocalMidnight } from './clock';

/**
 * The civil date on this device, kept current while the app stays open: «اليوم» and the due
 * dates would otherwise go on showing yesterday after midnight. Re-checks at the next midnight and
 * whenever the page comes back to the foreground (phones throttle timers in the background).
 */
export function useDay(today: () => string, now: () => number): string {
  const [day, setDay] = useState(today);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      setDay(today());
      clearTimeout(timer);
      timer = setTimeout(check, msUntilLocalMidnight(now()));
    };
    timer = setTimeout(check, msUntilLocalMidnight(now()));
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [today, now]);
  return day;
}
