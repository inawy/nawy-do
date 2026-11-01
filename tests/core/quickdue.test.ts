import { describe, expect, it } from 'vitest';
import { addDays, daysFromCivil, quickDueOptions } from '@/core/model';

describe('addDays', () => {
  it('crosses month, year and leap-day boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('round-trips with daysFromCivil', () => {
    for (let n = -800; n < 800; n += 37) {
      expect(daysFromCivil(addDays('2026-06-15', n))).toBe((daysFromCivil('2026-06-15') ?? 0) + n);
    }
  });
  it('leaves an invalid date alone', () => {
    expect(addDays('nope', 3)).toBe('nope');
  });
});

describe('quickDueOptions', () => {
  it('offers today, tomorrow and next week', () => {
    expect(quickDueOptions('2026-10-31').map((o) => o.value)).toEqual([
      '2026-10-31',
      '2026-11-01',
      '2026-11-07',
    ]);
  });
});
