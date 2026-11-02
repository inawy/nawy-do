import { createSignal } from './signal';

/** Chrome's `beforeinstallprompt` event (not in lib.dom). */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

/** Set while the browser offers to install the app; the app then shows «تثبيت التطبيق». */
export const installSignal = createSignal<() => void>();

/** Called once at startup: keeps the install offer instead of letting the browser show its own. */
export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const event = e as InstallPromptEvent;
    installSignal.set(() => {
      installSignal.set(undefined); // one offer per event
      void event.prompt();
    });
  });
  window.addEventListener('appinstalled', () => installSignal.set(undefined));
}
