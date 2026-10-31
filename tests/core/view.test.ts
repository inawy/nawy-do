import { describe, expect, it } from 'vitest';
import {
  canReorder,
  createList,
  listSelection,
  newTaskDefaults,
  resolveSelection,
  tombstoneList,
} from '@/core/model';

const L = createList('L', 'العمل', 1);

describe('resolveSelection', () => {
  it('keeps a live list and the smart views', () => {
    expect(resolveSelection(listSelection('L'), [L])).toBe('list:L');
    expect(resolveSelection('starred', [])).toBe('starred');
  });
  it('falls back to main when the list is gone or deleted', () => {
    expect(resolveSelection(listSelection('L'), [])).toBe('main');
    expect(resolveSelection(listSelection('L'), [tombstoneList(L, 5)])).toBe('main');
  });
});

describe('canReorder', () => {
  it('only main and a single list, and only with more than one open task', () => {
    expect(canReorder('main', 2)).toBe(true);
    expect(canReorder(listSelection('L'), 3)).toBe(true);
    expect(canReorder('main', 1)).toBe(false);
    for (const v of ['starred', 'scheduled', 'search'] as const)
      expect(canReorder(v, 5)).toBe(false);
  });
});

describe('newTaskDefaults', () => {
  it('a new intention takes on its view', () => {
    expect(newTaskDefaults(listSelection('L'), '2026-10-31')).toEqual({ listId: 'L' });
    expect(newTaskDefaults('starred', '2026-10-31')).toEqual({ starred: true });
    expect(newTaskDefaults('scheduled', '2026-10-31')).toEqual({ due: '2026-10-31' });
    expect(newTaskDefaults('main', '2026-10-31')).toEqual({});
  });
});
