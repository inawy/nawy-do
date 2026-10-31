import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBackup } from '@/features/backup';
import { useLists } from '@/features/lists';
import { useTasks } from '@/features/tasks';
import { createMemoryRepositories } from '../support/memory-repositories';

// The hooks run against the in-memory adapter: no IndexedDB, no browser storage. If they passed
// only with Dexie they would depend on it; passing here is the proof of the port (D-024).
let clock = 1_000;
const now = () => ++clock;
let counter = 0;
const newId = () => `id-${++counter}`;

describe('useTasks on the ports', () => {
  it('adds with the injected id, completes, and orders newest first', async () => {
    const repos = createMemoryRepositories();
    const { result } = renderHook(() => useTasks(repos.tasks, now, newId));
    await act(() => result.current.add('أولى'));
    await act(() => result.current.add('ثانية'));
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));
    expect(result.current.tasks.every((t) => t.id.startsWith('id-'))).toBe(true);
    const first = result.current.tasks[0];
    if (!first) throw new Error('no task');
    await act(() => result.current.toggle(first));
    await waitFor(() =>
      expect(result.current.tasks.find((t) => t.id === first.id)?.status).toBe('done'),
    );
  });

  it('delete writes a tombstone and undo brings the task back', async () => {
    const repos = createMemoryRepositories();
    const { result } = renderHook(() => useTasks(repos.tasks, now, newId));
    await act(() => result.current.add('مؤقتة'));
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    const task = result.current.tasks[0];
    if (!task) throw new Error('no task');
    await act(() => result.current.remove(task));
    await waitFor(() => expect(result.current.tasks).toHaveLength(0));
    expect(repos.dump().tasks[0]?.deletedAt).toBeDefined(); // a tombstone, not a removal
    await act(() => result.current.undoRemove());
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
  });

  it('shows the failure when the repository cannot be read', async () => {
    const repos = createMemoryRepositories();
    const broken = {
      ...repos.tasks,
      watch: (_ok: unknown, onError: (e: unknown) => void) => {
        onError(new Error('storage unavailable'));
        return () => undefined;
      },
    };
    const { result } = renderHook(() => useTasks(broken as never, now, newId));
    await waitFor(() => expect(result.current.failed).toBe(true));
  });

  it('moves and completes a selection in one call', async () => {
    const repos = createMemoryRepositories();
    const tasks = renderHook(() => useTasks(repos.tasks, now, newId));
    for (const t of ['أ', 'ب', 'ج']) await act(() => tasks.result.current.add(t));
    await waitFor(() => expect(tasks.result.current.tasks).toHaveLength(3));
    const ids = tasks.result.current.tasks.slice(0, 2).map((t) => t.id);
    await act(() => tasks.result.current.moveMany(ids, 'L1'));
    await waitFor(() =>
      expect(tasks.result.current.tasks.filter((t) => t.listId === 'L1')).toHaveLength(2),
    );
    await act(() => tasks.result.current.completeMany(ids));
    await waitFor(() =>
      expect(tasks.result.current.tasks.filter((t) => t.status === 'done')).toHaveLength(2),
    );
  });
});

describe('useLists on the ports', () => {
  it('creates, renames, reorders, and undoes a delete', async () => {
    const repos = createMemoryRepositories();
    const { result } = renderHook(() => useLists(repos.lists, now, newId));
    await act(async () => {
      expect(typeof (await result.current.add('أ'))).toBe('object');
      expect(typeof (await result.current.add('ب'))).toBe('object');
      expect(await result.current.add('  ')).toBe('empty');
    });
    await waitFor(() => expect(result.current.lists.map((l) => l.name)).toEqual(['أ', 'ب']));
    const second = result.current.lists[1];
    if (!second) throw new Error('no list');
    await act(() => result.current.move(second, -1));
    await waitFor(() => expect(result.current.lists.map((l) => l.name)).toEqual(['ب', 'أ']));
    const [a] = result.current.lists;
    if (!a) throw new Error('no list');
    await act(() => result.current.remove(a));
    await waitFor(() => expect(result.current.lists).toHaveLength(1));
    await act(() => result.current.undoRemove());
    await waitFor(() => expect(result.current.lists).toHaveLength(2));
  });
});

describe('useBackup on the ports', () => {
  it('exports and imports through the repository, refusing a foreign file', async () => {
    const repos = createMemoryRepositories();
    await repos.tasks.add('t1', 'نية', 5);
    const { result } = renderHook(() => useBackup(repos.backup, now));
    let text = '';
    await act(async () => {
      text = await result.current.exportJson();
    });
    expect(JSON.parse(text).tasks).toHaveLength(1);
    await act(() => result.current.importText('{"app":"other"}'));
    expect(result.current.outcome).toEqual({ kind: 'error', code: 'wrong-app' });
    await act(() => result.current.importText(text));
    expect(result.current.outcome).toMatchObject({ kind: 'imported', changed: 0 });
  });
});
