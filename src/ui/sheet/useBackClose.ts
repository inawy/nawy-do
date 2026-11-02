import { useEffect, useRef } from 'react';

// Closing a sheet by UI pops the history entry we pushed for it; that pop must not be mistaken
// for the user pressing Back (and React StrictMode mounts effects twice in development).
let ownPops = 0;

/**
 * While mounted, a sheet owns one history entry: the Android Back button (or browser back) closes
 * the sheet instead of leaving the app.
 */
export function useBackClose(onClose: () => void): void {
  // The latest callback, so the history entry is pushed once per sheet, not once per render.
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  });
  useEffect(() => {
    window.history.pushState({ nawySheet: true }, '');
    let popped = false;
    const onPop = () => {
      if (ownPops > 0) {
        ownPops -= 1;
        return;
      }
      popped = true;
      latest.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!popped) {
        ownPops += 1;
        window.history.back();
      }
    };
  }, []);
}
