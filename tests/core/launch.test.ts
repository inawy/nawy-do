import { describe, expect, it } from 'vitest';
import { parseLaunch } from '@/core/model';

describe('parseLaunch', () => {
  it('knows nothing special about a plain launch', () => {
    expect(parseLaunch('')).toEqual({ newTask: false, shared: undefined });
  });
  it('recognises the new-intention shortcut', () => {
    expect(parseLaunch('?new=1').newTask).toBe(true);
    expect(parseLaunch('?new=0').newTask).toBe(false);
  });
  it('joins shared title, text and url, without repeating one inside another', () => {
    const q = new URLSearchParams({
      share_title: 'مقال',
      share_text: 'اقرأ مقال ده',
      share_url: 'https://example.com/a',
    });
    expect(parseLaunch(`?${q}`).shared).toBe('اقرأ مقال ده https://example.com/a');
    const q2 = new URLSearchParams({
      share_text: 'شوف https://example.com/a',
      share_url: 'https://example.com/a',
    });
    expect(parseLaunch(`?${q2}`).shared).toBe('شوف https://example.com/a');
  });
  it('collapses whitespace, caps the length and ignores empty shares', () => {
    expect(parseLaunch('?share_text=%20%20a%0A%0Ab%20').shared).toBe('a b');
    expect(parseLaunch('?share_text=%20%20').shared).toBeUndefined();
    expect(parseLaunch(`?share_text=${'ا'.repeat(2000)}`).shared).toHaveLength(1000);
  });
});
