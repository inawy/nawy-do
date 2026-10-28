import { DEFAULT_DB_NAME, snapshotBeforeUpgrade } from '@/data';
import { systemClock } from './clock';

/**
 * Runs before the first render: a safety copy if the stored database is older than this build's
 * schema. Bounded to 3 s so a slow or blocked storage can never keep the app from opening.
 */
export async function prepareStorage(): Promise<void> {
  const copy = snapshotBeforeUpgrade(DEFAULT_DB_NAME, systemClock());
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
  await Promise.race([copy.then(() => undefined), timeout]);
}
