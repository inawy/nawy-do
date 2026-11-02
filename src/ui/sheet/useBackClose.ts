import { useEffect, useRef } from 'react';

// Closing a sheet by UI pops the history entry we pushed for it; that pop must not be mistaken
// for the user pressing Back (and React StrictMode mounts effects twice in development).
// Each pending pop expires after a while: if the browser had nothing to go back to, no event comes.
const ownPops: object[] = [];
const OWN_POP_TTL_MS = 500;

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
      if (ownPops.shift()) return;
      popped = true;
      latest.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!popped) {
        const token = {};
        ownPops.push(token);
        setTimeout(() => {
          const i = ownPops.indexOf(token);
          if (i >= 0) ownPops.splice(i, 1);
        }, OWN_POP_TTL_MS);
        window.history.back();
      }
    };
  }, []);
}
