import { describe, expect, it } from 'vitest';
import { ar } from '@/ui/i18n/ar';
import { en } from '@/ui/i18n/en';
import { formatDue, formatTime } from '@/ui/i18n/format';
import { format, makeI18n } from '@/ui/i18n';

const AR = makeI18n('ar');
const EN = makeI18n('en');

describe('messages', () => {
  it('English has exactly the keys Arabic has, and the same placeholders', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ar).sort());
    const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const key of Object.keys(ar) as (keyof typeof ar)[]) {
      expect(holes(en[key]), key).toBe(holes(ar[key]));
    }
  });

  it('fills placeholders and leaves a missing one visible', () => {
    expect(format('{a} و {b}', { a: 1 })).toBe('1 و {b}');
    expect(EN.t('select.count', { count: 3 })).toBe('3 selected');
  });

  it('the direction follows the language', () => {
    expect([AR.dir, EN.dir]).toEqual(['rtl', 'ltr']);
  });
});

describe('dates and times', () => {
  const today = '2026-10-27';
  it('Arabic', () => {
    expect(formatDue('2026-10-27', today, AR)).toBe('النهارده');
    expect(formatDue('2026-10-28', today, AR)).toBe('بكرة');
    expect(formatDue('2026-10-26', today, AR)).toBe('امبارح');
    expect(formatDue('2026-11-05', today, AR)).toBe('5 نوفمبر');
    expect(formatDue('2027-01-05', today, AR)).toBe('5 يناير 2027');
    expect(formatDue('2026-12-31', '2027-01-01', AR)).toBe('امبارح');
    expect(formatTime('00:15', AR)).toBe('12:15 ص');
    expect(formatTime('21:30', AR)).toBe('9:30 م');
    expect(formatTime('nope', AR)).toBe('nope');
  });
  it('English', () => {
    expect(formatDue('2026-10-27', today, EN)).toBe('Today');
    expect(formatDue('2026-11-05', today, EN)).toBe('Nov 5');
    expect(formatDue('2027-01-05', today, EN)).toBe('Jan 5, 2027');
    expect(formatTime('00:15', EN)).toBe('12:15 AM');
    expect(formatTime('12:00', EN)).toBe('12:00 PM');
    expect(formatTime('21:30', EN)).toBe('9:30 PM');
  });
});
