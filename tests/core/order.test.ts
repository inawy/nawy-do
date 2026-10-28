import { describe, expect, it } from 'vitest';
import { applyOrder, createTask, groupTasks, MIN_GAP, planMove, type Task } from '@/core/model';

const mk = (id: string, sortOrder: number): Task => createTask(id, id, 1, sortOrder);
const ids = (tasks: Task[]) => groupTasks(tasks).open.map((t) => t.id);
const move = (tasks: Task[], id: string, to: number) => {
  const displayed = groupTasks(tasks).open;
  return applyOrder(tasks, planMove(displayed, id, to));
};

describe('planMove', () => {
  const base = [mk('a', 400), mk('b', 300), mk('c', 200), mk('d', 100)]; // shown a b c d

  it('does nothing for a no-op or an unknown task', () => {
    expect(planMove(groupTasks(base).open, 'b', 1)).toEqual([]);
    expect(planMove(groupTasks(base).open, 'zzz', 0)).toEqual([]);
    expect(planMove([mk('only', 1)], 'only', 0)).toEqual([]);
  });

  it('moves one task with a single change, to every position', () => {
    for (const from of ['a', 'b', 'c', 'd']) {
      for (let to = 0; to < 4; to++) {
        const displayed = groupTasks(base).open;
        const expected = displayed.filter((t) => t.id !== from).map((t) => t.id);
        expected.splice(to, 0, from);
        const changes = planMove(displayed, from, to);
        expect(ids(applyOrder(base, changes))).toEqual(expected);
        expect(changes.length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('clamps an out-of-range target', () => {
    expect(ids(move(base, 'a', 99))).toEqual(['b', 'c', 'd', 'a']);
    expect(ids(move(base, 'd', -5))).toEqual(['d', 'a', 'b', 'c']);
  });

  it('renumbers the list when the neighbours are too close to split', () => {
    const tight = [mk('a', 10), mk('b', 10), mk('c', 10), mk('d', 10)]; // same millisecond
    const displayed = groupTasks(tight).open; // a b c d (ties by id)
    const changes = planMove(displayed, 'd', 1);
    expect(changes.length).toBeGreaterThan(1);
    expect(ids(applyOrder(tight, changes))).toEqual(['a', 'd', 'b', 'c']);
  });

  it('survives many repeated moves into the same gap (precision)', () => {
    let tasks = [
      mk('a', 1_700_000_000_000),
      mk('b', 1_700_000_000_001),
      mk('c', 1_700_000_000_002),
    ];
    const expected = ['c', 'b', 'a'];
    for (let i = 0; i < 200; i++) {
      // Keep moving the bottom item to the middle, then the new bottom item, and so on.
      const shown = ids(tasks);
      const last = shown[shown.length - 1] as string;
      tasks = move(tasks, last, 1);
      expected.splice(1, 0, expected.pop() as string);
      expect(ids(tasks)).toEqual(expected);
    }
    // After all that, every value is finite and the order is strictly decreasing with a real gap.
    const values = groupTasks(tasks).open.map((t) => t.sortOrder);
    for (let i = 1; i < values.length; i++) {
      expect(Number.isFinite(values[i])).toBe(true);
      expect((values[i - 1] as number) - (values[i] as number)).toBeGreaterThan(MIN_GAP / 2);
    }
  });

  it('a random sequence of moves always matches a plain array model', () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let tasks = Array.from({ length: 8 }, (_, i) => mk(`t${i}`, 1000 + i));
    let model = ids(tasks);
    for (let step = 0; step < 300; step++) {
      const id = model[Math.floor(rnd() * model.length)] as string;
      const to = Math.floor(rnd() * model.length);
      model = model.filter((x) => x !== id);
      model.splice(to, 0, id);
      tasks = move(tasks, id, to);
      expect(ids(tasks)).toEqual(model);
    }
  });
});
