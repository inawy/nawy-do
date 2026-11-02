// main.tsx (which talks to the service worker) sets the apply function when a new version is
// waiting, and the app shows a banner. Kept free of `virtual:` imports so tests can import it.
import { createSignal } from './signal';

export const updateSignal = createSignal<() => void>();
