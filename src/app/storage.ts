export type StorageState = 'persisted' | 'best-effort' | 'unsupported';

/**
 * Asks the browser not to evict this site's data under storage pressure. Android Chrome may clear
 * the data of a site that is not installed; a local-only app has no other copy, so this matters.
 * The browser decides (often granting it only to installed apps); the answer is shown to the user.
 */
export async function requestPersistence(): Promise<StorageState> {
  const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
  if (!storage?.persist || !storage.persisted) return 'unsupported';
  try {
    if (await storage.persisted()) return 'persisted';
    return (await storage.persist()) ? 'persisted' : 'best-effort';
  } catch {
    return 'best-effort';
  }
}
