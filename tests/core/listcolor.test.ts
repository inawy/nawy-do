import { describe, expect, it } from 'vitest';
import {
  buildEnvelope,
  createList,
  createTask,
  parseEnvelope,
  parseList,
  updateList,
} from '@/core/model';

describe('list colours', () => {
  const list = createList('L', 'العمل', 100);

  it('a new list has no colour unless one is given', () => {
    expect(list.color).toBeUndefined();
    expect(createList('M', 'البيت', 100, 'green').color).toBe('green');
  });

  it('updateList changes name and colour in one step; an empty name is ignored; "" clears', () => {
    const next = updateList(list, { name: ' شغل ', color: 'purple' }, 200);
    expect(next).toMatchObject({ name: 'شغل', color: 'purple', updatedAt: 200 });
    expect(updateList(next, { name: '  ' }, 300).name).toBe('شغل');
    expect(updateList(next, { color: '' }, 300).color).toBeUndefined();
    expect(updateList(next, { name: 'x' }, 300).color).toBe('purple'); // untouched when absent
  });

  it('parseList accepts a palette colour and refuses anything else', () => {
    expect(parseList({ ...list, color: 'teal' })).toMatchObject({ ok: true });
    expect(parseList({ ...list, color: '#ff0000' })).toEqual({ ok: false, error: 'color' });
    expect(parseList({ ...list, color: 'blue; background: red' })).toEqual({
      ok: false,
      error: 'color',
    });
  });

  it('round-trips through a backup, and a version-4 file (no colours) still imports', () => {
    const coloured = { ...list, color: 'amber' as const };
    const back = parseEnvelope(
      JSON.stringify(buildEnvelope([createTask('a', 'a', 1)], [coloured], 5)),
    );
    expect(back.ok && back.value.lists[0]?.color).toBe('amber');
    const v4 = { app: 'nawy-do', schemaVersion: 4, exportedAt: 1, tasks: [], lists: [list] };
    const r = parseEnvelope(JSON.stringify(v4));
    expect(r.ok && r.value.lists).toEqual([list]);
  });
});
