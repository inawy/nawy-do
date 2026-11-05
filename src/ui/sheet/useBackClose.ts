import { useEffect, useRef } from 'react';

// Every open sheet owns one history entry, and they form a stack: Back closes only the top one.
// Closing a sheet by UI pops its entry ourselves; that pop must not be mistaken for the person
// pressing Back (and React StrictMode mounts effects twice in development). One shared listener
// decides, so several mounted sheets never react to the same event.
interface Entry {
  close: { current: () => void };
}
const stack: Entry[] = [];
const ownPops: object[] = [];
// Generous: a slow device can take a while to traverse history. If the browser had nothing to go
// back to, no event comes and the token simply expires.
const OWN_POP_TTL_MS = 2000;
let listening = false;

function onPop(): void {
  if (ownPops.shift()) return;
  const top = stack.pop();
  top?.close.current();
}

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
    const entry: Entry = { close: latest };
    window.history.pushState({ nawySheet: true }, '');
    stack.push(entry);
    if (!listening) {
      window.addEventListener('popstate', onPop);
      listening = true;
    }
    return () => {
      const i = stack.indexOf(entry);
      if (i < 0) return; // closed by Back: its entry is already gone
      stack.splice(i, 1);
      const token = {};
      ownPops.push(token);
      setTimeout(() => {
        const j = ownPops.indexOf(token);
        if (j >= 0) ownPops.splice(j, 1);
      }, OWN_POP_TTL_MS);
      window.history.back();
    };
  }, []);
}
