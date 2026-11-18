import { describe, expect, it } from 'vitest';
import { findListByName, parseQuickAdd, quickTask } from '@/core/model';

const TODAY = '2026-11-12'; // a Thursday
const read = (s: string, lists: { id: string; name: string }[] = []) =>
  parseQuickAdd(s, TODAY, lists);

describe('quick add', () => {
  it('reads a Egyptian date and an afternoon time', () => {
    expect(read('اشتري خبز بكرة الساعة 5 م')).toMatchObject({
      title: 'اشتري خبز',
      due: '2026-11-13',
      dueTime: '17:00',
    });
  });

  it('reads the day after tomorrow, with a morning word', () => {
    expect(read('اتصل بأحمد بعد بكرة 9 صباحا')).toMatchObject({
      title: 'اتصل بأحمد',
      due: '2026-11-14',
      dueTime: '09:00',
    });
  });

  it('a weekday is the next one, never today', () => {
    expect(read('ذاكر يوم الجمعة').due).toBe('2026-11-13');
    expect(read('ذاكر يوم الخميس').due).toBe('2026-11-19');
  });

  it('a repeat without a date starts today', () => {
    expect(read('تمرين كل أسبوع')).toMatchObject({ title: 'تمرين', repeat: 'weekly', due: TODAY });
  });

  it('reads «every N units», with Arabic digits and the dual forms', () => {
    expect(read('اشرب دواء كل 3 أيام')).toMatchObject({
      title: 'اشرب دواء',
      repeat: 'daily',
      repeatEvery: 3,
      due: TODAY,
    });
    expect(read('حساب كل ٢ شهور')).toMatchObject({ repeat: 'monthly', repeatEvery: 2 });
    expect(read('تقرير كل اسبوعين')).toMatchObject({ repeat: 'weekly', repeatEvery: 2 });
    expect(read('call mom every 2 weeks')).toMatchObject({ repeat: 'weekly', repeatEvery: 2 });
    expect(read('سماد كل 4 سنين')).toMatchObject({ repeat: 'yearly', repeatEvery: 4 });
    expect(read('سماد كل سنتين')).toMatchObject({ repeat: 'yearly', repeatEvery: 2 });
  });

  it('«every 1» and a plain repeat carry no interval; a number too big stays text', () => {
    expect(read('تمرين كل يوم').repeatEvery).toBeUndefined();
    expect(read('تمرين كل 1 يوم').repeat).toBeUndefined();
    expect(read('كل 100 يوم').repeat).toBeUndefined();
  });

  it('the interval reaches the task options', () => {
    const q = quickTask('دواء كل 3 ايام', false, 'main', [], TODAY);
    expect(q.options).toMatchObject({ repeat: 'daily', repeatEvery: 3 });
  });

  it('reads English the same way', () => {
    expect(read('Buy milk tomorrow at 5pm')).toMatchObject({
      title: 'Buy milk',
      due: '2026-11-13',
      dueTime: '17:00',
    });
    expect(read('meeting next week 14:30')).toMatchObject({ due: '2026-11-19', dueTime: '14:30' });
    expect(read('call mom in 3 days').due).toBe('2026-11-15');
  });

  it('handles midnight, 24 h clocks and Arabic-Indic digits', () => {
    expect(read('اجتماع الساعة 12 بالليل').dueTime).toBe('00:00');
    expect(read('صلاة الساعة 4:30 فجرا').dueTime).toBe('04:30');
    expect(read('اجتماع بكرة الساعة ٥ م').dueTime).toBe('17:00');
  });

  it('leaves plain numbers and unknown words alone', () => {
    expect(read('ركز في 5 مهام')).toMatchObject({ title: 'ركز في 5 مهام', matches: [] });
  });

  it('keeps what was typed when nothing else would be left', () => {
    expect(read('بكرة')).toMatchObject({ title: 'بكرة', matches: [] });
  });

  it('reads «!» as a star and «#list» only when that list exists', () => {
    const lists = [{ id: 'h', name: 'البيت' }];
    expect(read('ادفع الفاتورة ! #البيت', lists)).toMatchObject({
      title: 'ادفع الفاتورة',
      starred: true,
      listName: 'البيت',
    });
    expect(read('اكتب #فكرة', lists)).toMatchObject({ title: 'اكتب #فكرة', matches: [] });
  });

  it('finds a list by name ignoring Arabic letter variants', () => {
    expect(findListByName([{ id: 'x', name: 'الأعمال' }], 'الاعمال')?.id).toBe('x');
  });

  it('quickTask layers the reading over the view defaults, or ignores it when literal', () => {
    const lists = [{ id: 'h', name: 'البيت' }];
    expect(quickTask('نظف بكرة #البيت', false, 'starred', lists, TODAY)).toEqual({
      title: 'نظف',
      options: { starred: true, due: '2026-11-13', listId: 'h' },
    });
    expect(quickTask('نظف بكرة', true, 'main', lists, TODAY)).toEqual({
      title: 'نظف بكرة',
      options: {},
    });
  });
});
