import {
  cleanListName,
  completeTask,
  createList,
  createTask,
  isDeleted,
  liveLists,
  MAX_LISTS,
  nextUpdatedAt,
  parseEnvelope,
  renameList,
  reopenTask,
  restoreList,
  restoreTask,
  tombstoneList,
  tombstoneTask,
  updateTask,
  buildEnvelope,
  mergeTask,
  mergeRecord,
  type Task,
  type TaskList,
} from '@/core/model';
import type { Repositories, Watch } from '@/core/ports';

/**
 * An in-memory implementation of the storage ports, for tests. It reuses the core rules (so it
 * behaves like the real adapter) but has no IndexedDB, no async scheduling and no browser: a hook
 * test that passes with this and with Dexie proves the hook only depends on the port.
 */
export function createMemoryRepositories(): Repositories & {
  /** Every record including tombstones, to assert on what was stored. */
  dump: () => { tasks: Task[]; lists: TaskList[] };
} {
  const tasks = new Map<string, Task>();
  const lists = new Map<string, TaskList>();
  const taskSubs = new Set<() => void>();
  const listSubs = new Set<() => void>();
  const copies: { id: number; createdAt: number; fromVersion: number; json: string }[] = [];

  const liveTasks = () =>
    [...tasks.values()]
      .filter((t) => !isDeleted(t))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const watchOf =
    <T>(subs: Set<() => void>, read: () => T[]): Watch<T> =>
    (onChange) => {
      const push = () => onChange(read());
      subs.add(push);
      queueMicrotask(push);
      return () => subs.delete(push);
    };
  const putTask = (t: Task) => {
    tasks.set(t.id, t);
    taskSubs.forEach((f) => f());
    return t;
  };
  const putList = (l: TaskList) => {
    lists.set(l.id, l);
    listSubs.forEach((f) => f());
    return l;
  };
  const liveTask = (id: string) => {
    const t = tasks.get(id);
    return t && !isDeleted(t) ? t : undefined;
  };
  const changeMany = async (ids: readonly string[], fn: (t: Task) => Task) => {
    let n = 0;
    for (const id of new Set(ids)) {
      const t = liveTask(id);
      if (!t) continue;
      const next = fn(t);
      if (next !== t) {
        tasks.set(id, next);
        n++;
      }
    }
    taskSubs.forEach((f) => f());
    return n;
  };

  return {
    dump: () => ({ tasks: [...tasks.values()], lists: [...lists.values()] }),
    tasks: {
      watch: watchOf(taskSubs, liveTasks),
      add: async (id, title, now, options = {}) => {
        const t = createTask(id, title, now);
        if (options.listId) t.listId = options.listId;
        if (options.starred) t.starred = true;
        if (options.due) t.due = options.due;
        return putTask(t);
      },
      edit: async (id, patch, now) => {
        const t = liveTask(id);
        return t ? putTask(updateTask(t, patch, now)) : undefined;
      },
      complete: async (id, now) => {
        const t = liveTask(id);
        return t ? putTask(completeTask(t, now)) : undefined;
      },
      reopen: async (id, now) => {
        const t = liveTask(id);
        return t ? putTask(reopenTask(t, now)) : undefined;
      },
      remove: async (id, now) => {
        const t = liveTask(id);
        return t ? putTask(tombstoneTask(t, now)) : undefined;
      },
      restore: async (previous, now) => {
        const current = tasks.get(previous.id);
        if (!current || !isDeleted(current)) return undefined;
        return putTask(restoreTask(previous, current, now));
      },
      saveOrder: async (changes, now) => {
        let n = 0;
        for (const c of changes) {
          const t = liveTask(c.id);
          if (!t) continue;
          tasks.set(c.id, updateTask(t, { sortOrder: c.sortOrder }, now));
          n++;
        }
        taskSubs.forEach((f) => f());
        return n;
      },
      moveToList: (ids, listId, now) =>
        changeMany(ids, (t) => updateTask(t, { listId: listId ?? '' }, now)),
      completeMany: (ids, now) =>
        changeMany(ids, (t) => (t.status === 'open' ? completeTask(t, now) : t)),
    },
    lists: {
      watch: watchOf(listSubs, () => liveLists([...lists.values()])),
      add: async (id, name, now) => {
        if (cleanListName(name) === '') return { ok: false, reason: 'empty' };
        const live = liveLists([...lists.values()]);
        if (live.length >= MAX_LISTS) return { ok: false, reason: 'limit' };
        const last = live.at(-1)?.sortOrder ?? 0;
        return { ok: true, list: putList(createList(id, name, Math.max(now, last + 1))) };
      },
      rename: async (id, name, now) => {
        const l = lists.get(id);
        return l && l.deletedAt === undefined ? putList(renameList(l, name, now)) : undefined;
      },
      remove: async (id, now) => {
        const l = lists.get(id);
        return l && l.deletedAt === undefined ? putList(tombstoneList(l, now)) : undefined;
      },
      restore: async (previous, now) => {
        const current = lists.get(previous.id);
        if (!current || current.deletedAt === undefined) return undefined;
        return putList(restoreList(previous, current, now));
      },
      saveOrder: async (changes, now) => {
        let n = 0;
        for (const c of changes) {
          const l = lists.get(c.id);
          if (!l || l.deletedAt !== undefined) continue;
          lists.set(c.id, {
            ...l,
            sortOrder: c.sortOrder,
            updatedAt: nextUpdatedAt(l.updatedAt, now),
          });
          n++;
        }
        listSubs.forEach((f) => f());
        return n;
      },
    },
    backup: {
      export: async (now) =>
        JSON.stringify(buildEnvelope([...tasks.values()], [...lists.values()], now)),
      import: async (text, options) => {
        const parsed = parseEnvelope(text, options);
        if (!parsed.ok) return parsed;
        let listsChanged = 0;
        let changed = 0;
        for (const l of parsed.value.lists) {
          const e = lists.get(l.id);
          const w = e ? mergeRecord(e, l) : l;
          if (w !== e) {
            lists.set(l.id, w);
            listsChanged++;
          }
        }
        for (const t of parsed.value.tasks) {
          const e = tasks.get(t.id);
          const w = e ? mergeTask(e, t) : t;
          if (w !== e) {
            tasks.set(t.id, w);
            changed++;
          }
        }
        taskSubs.forEach((f) => f());
        listSubs.forEach((f) => f());
        return {
          ok: true,
          value: {
            total: parsed.value.tasks.length,
            changed,
            lists: parsed.value.lists.length,
            listsChanged,
          },
        };
      },
      safetyCopies: async () => [...copies],
    },
  };
}
