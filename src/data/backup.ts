import {
  buildEnvelope,
  parseEnvelope,
  type Envelope,
  type EnvelopeError,
  type EnvelopeOptions,
  type Result,
} from '@/core/model';
import { allLists, applyLists } from './lists';
import type { NawyDoDb } from './schema';
import { allRecords, applyRecords } from './store';

export async function exportBackup(db: NawyDoDb, now: number): Promise<string> {
  const [tasks, lists] = await Promise.all([allRecords(db), allLists(db)]);
  return JSON.stringify(buildEnvelope(tasks, lists, now));
}

export type ImportResult = Result<
  { total: number; changed: number; lists: number; listsChanged: number },
  EnvelopeError
>;

/** Parse first, write after: a bad file changes nothing. Existing data is merged, not replaced. */
export async function importBackup(
  db: NawyDoDb,
  text: string,
  options?: EnvelopeOptions,
): Promise<ImportResult> {
  const parsed: Result<Envelope, EnvelopeError> = parseEnvelope(text, options);
  if (!parsed.ok) return parsed;
  const { tasks, lists } = parsed.value;
  // Lists first, so a task never points at a list that is not there yet.
  const listsChanged = await applyLists(db, lists);
  const changed = await applyRecords(db, tasks);
  return { ok: true, value: { total: tasks.length, changed, lists: lists.length, listsChanged } };
}
