// Is this page running inside the Android shell (Capacitor, ADR 0045), not in a browser tab?
// Capacitor puts a global in the page before any script runs, so no import is needed to ask.

interface NativeWindow {
  readonly Capacitor?: { readonly isNativePlatform?: () => boolean };
  /** Put in the page by the Android shell itself. */
  readonly androidBridge?: unknown;
}

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as NativeWindow;
  try {
    return w.Capacitor?.isNativePlatform?.() === true || w.androidBridge !== undefined;
  } catch {
    return false;
  }
}
