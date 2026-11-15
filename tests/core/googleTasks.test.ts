import { describe, expect, it } from 'vitest';
import { googleTasksToEnvelope, isGoogleTasks, parseEnvelopeValue } from '@/core/model';

const file = {
  kind: 'tasks#taskLists',
  items: [
    {
      kind: 'tasks#taskList',
      id: 'L1',
      title: 'My Tasks',
      items: [
        {
          id: 'a',
          title: 'خبز',
          position: '2',
          status: 'needsAction',
          due: '2026-11-20T00:00:00.000Z',
          notes: 'من المخبز',
        },
        {
          id: 'b',
          title: 'لبن',
          position: '1',
          status: 'completed',
          completed: '2026-11-10T08:00:00.000Z',
        },
        { id: 'c', title: 'محذوف', position: '3', status: 'needsAction', deleted: true },
        { id: 's1', title: 'خطوة', parent: 'a', position: '1', status: 'completed' },
      ],
    },
    {
      kind: 'tasks#taskList',
      id: 'L2',
      title: 'البيت',
      items: [{ id: 'd', title: 'اغسل', position: '1', status: 'needsAction' }],
    },
  ],
};

describe('Google Tasks import', () => {
  it('recognises the file', () => {
    expect(isGoogleTasks(file)).toBe(true);
    expect(isGoogleTasks({ app: 'nawy-do' })).toBe(false);
  });

  it('converts lists, tasks, steps and dates into a valid envelope', () => {
    const r = googleTasksToEnvelope(file, 1_000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(parseEnvelopeValue(r.value).ok).toBe(true);
    expect(r.value.lists.map((l) => l.name)).toEqual(['البيت']);
    const byTitle = Object.fromEntries(r.value.tasks.map((t) => [t.title, t]));
    expect(Object.keys(byTitle).sort()).toEqual(['اغسل', 'خبز', 'لبن'].sort());
    expect(byTitle['خبز']?.due).toBe('2026-11-20');
    expect(byTitle['خبز']?.notes).toBe('من المخبز');
    expect(byTitle['خبز']?.steps?.[0]?.done).toBe(true);
    expect(byTitle['لبن']?.status).toBe('done');
    expect(byTitle['لبن']?.listId).toBeUndefined();
    expect(byTitle['اغسل']?.listId).toBe(r.value.lists[0]?.id);
    // position order: «لبن» (1) before «خبز» (2)
    expect((byTitle['لبن']?.sortOrder ?? 0) < (byTitle['خبز']?.sortOrder ?? 0)).toBe(true);
  });

  it('gives the same ids every time, so a second import merges', () => {
    const a = googleTasksToEnvelope(file, 1);
    const b = googleTasksToEnvelope(file, 2);
    expect(a.ok && b.ok && a.value.tasks.map((t) => t.id)).toEqual(
      b.ok ? b.value.tasks.map((t) => t.id) : [],
    );
  });
});
