import { err, ok, type Result } from './result';
import type { Task, TaskList } from './types';
import { parseList, parseTask } from './validate';

// The export/backup file format (D-008). Every parse goes through here.
export const APP_ID = 'nawy-do';
/** Bump when the format changes, and add a step to MIGRATIONS for the previous version. */
export const SCHEMA_VERSION = 2;
export const MAX_RECORDS = 100_000;

export interface Envelope {
  app: typeof APP_ID;
  schemaVersion: number;
  exportedAt: number;
  tasks: Task[];
  /** Added in version 2 (D-017). */
  lists: TaskList[];
}

export type EnvelopeError =
  | { code: 'not-json' }
  | { code: 'not-an-envelope' }
  | { code: 'wrong-app'; found: unknown }
  | { code: 'bad-version'; found: unknown }
  /** From a newer app version: refuse rather than guess. */
  | { code: 'newer-version'; found: number; supported: number }
  | { code: 'no-migration'; from: number }
  | { code: 'too-many-records'; max: number }
  | { code: 'invalid-record'; index: number; reason: string }
  | { code: 'invalid-list'; index: number; reason: string }
  | { code: 'duplicate-id'; id: string };

export type Migration = (envelope: Record<string, unknown>) => Record<string, unknown>;
/** Steps keyed by the version they upgrade FROM. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  // 1 → 2: lists were added; a version-1 file has none.
  1: (envelope) => ({ ...envelope, lists: [] }),
};

export interface EnvelopeOptions {
  /** Overrides, for tests only. */
  currentVersion?: number;
  migrations?: Readonly<Record<number, Migration>>;
  maxRecords?: number;
}

export function buildEnvelope(
  tasks: readonly Task[],
  lists: readonly TaskList[],
  exportedAt: number,
): Envelope {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    tasks: [...tasks],
    lists: [...lists],
  };
}

export function parseEnvelope(
  text: string,
  options?: EnvelopeOptions,
): Result<Envelope, EnvelopeError> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return err({ code: 'not-json' });
  }
  return parseEnvelopeValue(raw, options);
}

export function parseEnvelopeValue(
  raw: unknown,
  options: EnvelopeOptions = {},
): Result<Envelope, EnvelopeError> {
  const current = options.currentVersion ?? SCHEMA_VERSION;
  const migrations = options.migrations ?? MIGRATIONS;
  const maxRecords = options.maxRecords ?? MAX_RECORDS;

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return err({ code: 'not-an-envelope' });
  }
  let obj = raw as Record<string, unknown>;
  if (obj['app'] !== APP_ID) return err({ code: 'wrong-app', found: obj['app'] });

  const version = obj['schemaVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return err({ code: 'bad-version', found: version });
  }
  if (version > current) return err({ code: 'newer-version', found: version, supported: current });
  for (let v = version; v < current; v++) {
    const step = migrations[v];
    if (!step) return err({ code: 'no-migration', from: v });
    obj = step(obj);
  }

  const list = obj['tasks'];
  if (!Array.isArray(list)) return err({ code: 'not-an-envelope' });
  if (list.length > maxRecords) return err({ code: 'too-many-records', max: maxRecords });

  const tasks: Task[] = [];
  const seen = new Set<string>();
  for (const [index, item] of list.entries()) {
    const parsed = parseTask(item);
    if (!parsed.ok) return err({ code: 'invalid-record', index, reason: parsed.error });
    if (seen.has(parsed.value.id)) return err({ code: 'duplicate-id', id: parsed.value.id });
    seen.add(parsed.value.id);
    tasks.push(parsed.value);
  }
  const rawLists = obj['lists'];
  if (!Array.isArray(rawLists)) return err({ code: 'not-an-envelope' });
  if (rawLists.length > maxRecords) return err({ code: 'too-many-records', max: maxRecords });
  const lists: TaskList[] = [];
  const seenLists = new Set<string>();
  for (const [index, item] of rawLists.entries()) {
    const parsed = parseList(item);
    if (!parsed.ok) return err({ code: 'invalid-list', index, reason: parsed.error });
    if (seenLists.has(parsed.value.id)) return err({ code: 'duplicate-id', id: parsed.value.id });
    seenLists.add(parsed.value.id);
    lists.push(parsed.value);
  }
  const exportedAt = typeof obj['exportedAt'] === 'number' ? obj['exportedAt'] : 0;
  return ok({ app: APP_ID, schemaVersion: current, exportedAt, tasks, lists });
}
