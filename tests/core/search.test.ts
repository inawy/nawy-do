import { describe, expect, it } from 'vitest';
import { createTask, foldText, searchTasks, tombstoneTask } from '@/core/model';

const t = (id: string, title: string, extra = {}) => ({ ...createTask(id, title, 1), ...extra });

describe('foldText', () => {
  it('makes Arabic spellings equal', () => {
    expect(foldText('أحمد')).toBe(foldText('احمد'));
    expect(foldText('مَدرسة')).toBe(foldText('مدرسه'));
    expect(foldText('علـى')).toBe(foldText('علي'));
    expect(foldText('Milk')).toBe('milk');
  });
});

describe('searchTasks', () => {
  const tasks = [
    t('a', 'اشتري لبن'),
    t('b', 'اتصل بأحمد', { notes: 'بخصوص المدرسة' }),
    t('c', 'مهمة', { steps: [{ id: 's', title: 'احجز التذكرة', done: false }] }),
    tombstoneTask(t('d', 'لبن محذوف'), 5),
  ];
  const ids = (q: string) => searchTasks(tasks, q).map((x) => x.id);

  it('finds by title, notes and step titles, ignoring spelling variants', () => {
    expect(ids('لبن')).toEqual(['a']);
    expect(ids('احمد')).toEqual(['b']);
    expect(ids('مدرسه')).toEqual(['b']);
    expect(ids('تذكره')).toEqual(['c']);
  });

  it('needs every word, in any order', () => {
    expect(ids('اتصل أحمد')).toEqual(['b']);
    expect(ids('أحمد اشتري')).toEqual([]);
  });

  it('never returns deleted tasks, and an empty query matches nothing', () => {
    expect(ids('محذوف')).toEqual([]);
    expect(ids('   ')).toEqual([]);
  });
});
