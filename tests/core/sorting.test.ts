import { describe, expect, it } from 'vitest';
import { canReorder, createTask, isSortable, isSortMode, sortOpen, type Task } from '@/core/model';

const task = (id: string, title: string, due?: string): Task => ({
  ...createTask(id, title, 1),
  ...(due ? { due } : {}),
});
const ids = (list: Task[]) => list.map((t) => t.id);

describe('sortOpen', () => {
  const given = [task('c', 'جيم', '2026-11-05'), task('a', 'ألف'), task('b', 'باء', '2026-11-01')];

  it('manual keeps the order it was given', () => {
    expect(ids(sortOpen(given, 'manual'))).toEqual(['c', 'a', 'b']);
  });
  it('by date: earliest first, undated last', () => {
    expect(ids(sortOpen(given, 'date'))).toEqual(['b', 'c', 'a']);
  });
  it('by title: Arabic alphabetical', () => {
    expect(ids(sortOpen(given, 'title'))).toEqual(['a', 'b', 'c']);
  });
  it('is stable: equal keys keep the given order', () => {
    const same = [task('x', 'س', '2026-11-01'), task('y', 'ص', '2026-11-01'), task('z', 'ع')];
    expect(ids(sortOpen(same, 'date'))).toEqual(['x', 'y', 'z']);
    const twins = [task('p', 'نفس'), task('q', 'نفس')];
    expect(ids(sortOpen(twins, 'title'))).toEqual(['p', 'q']);
  });
  it('does not change the input', () => {
    const copy = [...given];
    sortOpen(given, 'title');
    expect(given).toEqual(copy);
  });
});

describe('sort and re-ordering', () => {
  it('only the manual order can be dragged', () => {
    expect(canReorder('main', 3, 'manual')).toBe(true);
    expect(canReorder('main', 3, 'date')).toBe(false);
    expect(canReorder('list:L', 3, 'title')).toBe(false);
  });
  it('the sort applies to main, lists and favourites, not to scheduled, today or search', () => {
    expect(['main', 'starred', 'list:L'].every((v) => isSortable(v as 'main'))).toBe(true);
    expect(['scheduled', 'today', 'search'].some((v) => isSortable(v as 'main'))).toBe(false);
  });
  it('validates a stored mode', () => {
    expect(isSortMode('date')).toBe(true);
    expect(isSortMode('random')).toBe(false);
    expect(isSortMode(null)).toBe(false);
  });
});
