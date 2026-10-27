import { describe, expect, it } from 'vitest';
import { buildEnvelope, createTask, parseEnvelope, parseTask } from '@/core/model';

const t = createTask('a', 'x', 100);
const text = (o: unknown) => JSON.stringify(o);

describe('parseTask', () => {
  it('accepts a valid task and drops unknown fields', () => {
    const r = parseTask({ ...t, evil: 1 });
    expect(r.ok && r.value).toEqual(t);
  });
  it.each([
    [{ ...t, id: '' }, 'id'],
    [{ ...t, status: 'x' }, 'status'],
    [{ ...t, due: '2026-13-01' }, 'due'],
    [{ ...t, due: '2026-02-31' }, 'due'],
    [{ ...t, updatedAt: -1 }, 'updatedAt'],
    [{ ...t, title: 5 }, 'title'],
  ])('rejects %j', (raw, field) => {
    const r = parseTask(raw);
    expect(!r.ok && r.error).toBe(field);
  });
});

describe('envelope', () => {
  it('round-trips', () => {
    const r = parseEnvelope(text(buildEnvelope([t], 5)));
    expect(r.ok && r.value.tasks).toEqual([t]);
  });
  it('rejects non-JSON, other apps, newer versions, bad records and duplicates', () => {
    const base = buildEnvelope([t], 5);
    expect(parseEnvelope('{')).toEqual({ ok: false, error: { code: 'not-json' } });
    const wrong = parseEnvelope(text({ ...base, app: 'nawy-today' }));
    expect(!wrong.ok && wrong.error.code).toBe('wrong-app');
    const newer = parseEnvelope(text({ ...base, schemaVersion: 2 }));
    expect(!newer.ok && newer.error.code).toBe('newer-version');
    const bad = parseEnvelope(text({ ...base, tasks: [{ ...t, status: 'zzz' }] }));
    expect(!bad.ok && bad.error).toEqual({ code: 'invalid-record', index: 0, reason: 'status' });
    const dup = parseEnvelope(text({ ...base, tasks: [t, t] }));
    expect(!dup.ok && dup.error.code).toBe('duplicate-id');
  });
  it('limits the record count', () => {
    const r = parseEnvelope(text(buildEnvelope([t, createTask('b', 'b', 1)], 5)), {
      maxRecords: 1,
    });
    expect(!r.ok && r.error.code).toBe('too-many-records');
  });
  it('migrates an older file step by step, and fails if a step is missing', () => {
    const old = { app: 'nawy-do', schemaVersion: 1, exportedAt: 1, items: [t] };
    const migrations = { 1: (e: Record<string, unknown>) => ({ ...e, tasks: e['items'] }) };
    const ok = parseEnvelope(text(old), { currentVersion: 2, migrations });
    expect(ok.ok && ok.value.tasks).toEqual([t]);
    const missing = parseEnvelope(text(old), { currentVersion: 2, migrations: {} });
    expect(!missing.ok && missing.error).toEqual({ code: 'no-migration', from: 1 });
  });
});
