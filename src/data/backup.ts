import {
  buildEnvelope,
  parseEnvelope,
  type Envelope,
  type EnvelopeError,
  type EnvelopeOptions,
  type Result,
} from '@/core/model';
import type { NawyDoDb } from './schema';
import { allRecords, applyRecords } from './store';

export async function exportBackup(db: NawyDoDb, now: number): Promise<string> {
  return JSON.stringify(buildEnvelope(await allRecords(db), now));
}

export type ImportResult = Result<{ total: number; changed: number }, EnvelopeError>;

/** Parse first, write after: a bad file changes nothing. Existing data is merged, not replaced. */
export async function importBackup(
  db: NawyDoDb,
  text: string,
  options?: EnvelopeOptions,
): Promise<ImportResult> {
  const parsed: Result<Envelope, EnvelopeError> = parseEnvelope(text, options);
  if (!parsed.ok) return parsed;
  const changed = await applyRecords(db, parsed.value.tasks);
  return { ok: true, value: { total: parsed.value.tasks.length, changed } };
}
