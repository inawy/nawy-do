import { describe, expect, it } from 'vitest';
import { changedFields, type DetailsForm } from '@/ui/details/formPatch';

const base: DetailsForm = {
  title: 'نية',
  notes: '',
  due: '',
  dueTime: '',
  repeat: '',
  starred: false,
  steps: [],
  listId: '',
};

describe('changedFields', () => {
  it('is empty when nothing changed, so an untouched task is not rewritten', () => {
    expect(changedFields(base, { ...base })).toEqual({});
  });

  it('sends only what changed', () => {
    expect(changedFields(base, { ...base, starred: true, notes: 'ملاحظة' })).toEqual({
      starred: true,
      notes: 'ملاحظة',
    });
  });

  it('clearing the date clears its time and repetition', () => {
    const before = { ...base, due: '2026-11-05', dueTime: '09:00', repeat: 'daily' as const };
    expect(changedFields(before, { ...before, due: '' })).toEqual({
      due: '',
      dueTime: '',
      repeat: '',
    });
  });

  it('keeps an empty title from replacing the old one', () => {
    expect(changedFields(base, { ...base, title: '  ' })).toEqual({});
  });

  it('leaves the list alone unless the person picked another', () => {
    expect(changedFields(base, { ...base, title: 'جديدة' })).not.toHaveProperty('listId');
    expect(changedFields(base, { ...base, listId: 'L' })).toEqual({ listId: 'L' });
  });
});
