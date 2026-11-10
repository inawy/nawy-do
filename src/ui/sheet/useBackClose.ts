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
    let entry: Entry | undefined;
    let cancelled = false;
    let stopWaiting = (): void => {};
    const open = () => {
      if (cancelled) return;
      entry = { close: latest };
      window.history.pushState({ nawySheet: true }, '');
      stack.push(entry);
      if (!listening) {
        window.addEventListener('popstate', onPop);
        listening = true;
      }
    };
    if (ownPops.length > 0) {
      // Another sheet (or the side menu) just closed in the same moment and its pop of the history
      // is still on its way. Pushing now would let that pop remove THIS sheet's entry, and its
      // later close would then leave the app. Wait for the pop (the shared listener runs first).
      const go = () => {
        stopWaiting();
        open();
      };
      const timer = window.setTimeout(go, 300);
      window.addEventListener('popstate', go);
      stopWaiting = () => {
        window.clearTimeout(timer);
        window.removeEventListener('popstate', go);
      };
    } else {
      open();
    }
    return () => {
      cancelled = true;
      stopWaiting();
      if (!entry) return; // never opened: no entry to give back
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
