import { describe, expect, it } from 'vitest';
import { buildEnvelope, createList, createTask, parseEnvelope, parseTask } from '@/core/model';

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
    const r = parseEnvelope(text(buildEnvelope([t], [], 5)));
    expect(r.ok && r.value.tasks).toEqual([t]);
  });
  it('rejects non-JSON, other apps, newer versions, bad records and duplicates', () => {
    const base = buildEnvelope([t], [], 5);
    expect(parseEnvelope('{')).toEqual({ ok: false, error: { code: 'not-json' } });
    const wrong = parseEnvelope(text({ ...base, app: 'nawy-today' }));
    expect(!wrong.ok && wrong.error.code).toBe('wrong-app');
    const newer = parseEnvelope(text({ ...base, schemaVersion: 3 }));
    expect(!newer.ok && newer.error.code).toBe('newer-version');
    const bad = parseEnvelope(text({ ...base, tasks: [{ ...t, status: 'zzz' }] }));
    expect(!bad.ok && bad.error).toEqual({ code: 'invalid-record', index: 0, reason: 'status' });
    const dup = parseEnvelope(text({ ...base, tasks: [t, t] }));
    expect(!dup.ok && dup.error.code).toBe('duplicate-id');
  });
  it('limits the record count', () => {
    const r = parseEnvelope(text(buildEnvelope([t, createTask('b', 'b', 1)], [], 5)), {
      maxRecords: 1,
    });
    expect(!r.ok && r.error.code).toBe('too-many-records');
  });
  it('migrates an older file step by step, and fails if a step is missing', () => {
    const old = { app: 'nawy-do', schemaVersion: 1, exportedAt: 1, items: [t] };
    const migrations = {
      1: (e: Record<string, unknown>) => ({ ...e, tasks: e['items'], lists: [] }),
    };
    const ok = parseEnvelope(text(old), { currentVersion: 2, migrations });
    expect(ok.ok && ok.value.tasks).toEqual([t]);
    const missing = parseEnvelope(text(old), { currentVersion: 2, migrations: {} });
    expect(!missing.ok && missing.error).toEqual({ code: 'no-migration', from: 1 });
  });
});

describe('envelope with lists (version 2)', () => {
  const list = createList('L', 'العمل', 10);

  it('round-trips lists and requires the field', () => {
    const file = text(buildEnvelope([t], [list], 5));
    const r = parseEnvelope(file);
    expect(r.ok && r.value.lists).toEqual([list]);
    const withoutLists = JSON.parse(file) as Record<string, unknown>;
    delete withoutLists['lists'];
    const missing = parseEnvelope(text(withoutLists));
    expect(!missing.ok && missing.error.code).toBe('not-an-envelope');
  });

  it('upgrades a real version-1 file with the shipped migration (no lists, tasks kept)', () => {
    const v1 = { app: 'nawy-do', schemaVersion: 1, exportedAt: 1, tasks: [t] };
    const r = parseEnvelope(text(v1));
    expect(r.ok && r.value.schemaVersion).toBe(2);
    expect(r.ok && r.value.tasks).toEqual([t]);
    expect(r.ok && r.value.lists).toEqual([]);
  });

  it('rejects an invalid or duplicate list', () => {
    const base = buildEnvelope([t], [list], 5);
    const bad = parseEnvelope(text({ ...base, lists: [{ ...list, name: 5 }] }));
    expect(!bad.ok && bad.error).toEqual({ code: 'invalid-list', index: 0, reason: 'name' });
    const dup = parseEnvelope(text({ ...base, lists: [list, list] }));
    expect(!dup.ok && dup.error.code).toBe('duplicate-id');
  });

  it('a task keeps its listId through parse, and a bad one is rejected', () => {
    const ok = parseTask({ ...t, listId: 'L' });
    expect(ok.ok && ok.value.listId).toBe('L');
    const bad = parseTask({ ...t, listId: 5 });
    expect(!bad.ok && bad.error).toBe('listId');
  });
});
