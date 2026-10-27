// A tiny external store: main.tsx (which talks to the service worker) sets the apply function when
// a new version is waiting, and the app shows a banner. Kept free of `virtual:` imports so tests
// can import it.
type Apply = () => void;
let pending: Apply | undefined;
const listeners = new Set<() => void>();

export const updateSignal = {
  set(apply: Apply | undefined): void {
    pending = apply;
    listeners.forEach((l) => l());
  },
  get: (): Apply | undefined => pending,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
