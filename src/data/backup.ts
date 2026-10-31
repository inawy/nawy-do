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
  // One transaction: either the whole file is merged or nothing is (a tab closing half-way must
  // not leave lists without their tasks). Lists first, so a task never points at a missing list.
  const { changed, listsChanged } = await db.transaction('rw', db.tasks, db.lists, async () => {
    const listsChanged = await applyLists(db, lists);
    const changed = await applyRecords(db, tasks);
    return { changed, listsChanged };
  });
  return { ok: true, value: { total: tasks.length, changed, lists: lists.length, listsChanged } };
}
