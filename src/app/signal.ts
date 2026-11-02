/** A tiny external store (for `useSyncExternalStore`): the value, `set`, and `subscribe`. */
export function createSignal<T>() {
  let value: T | undefined;
  const listeners = new Set<() => void>();
  return {
    set(next: T | undefined): void {
      value = next;
      listeners.forEach((l) => l());
    },
    get: (): T | undefined => value,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
