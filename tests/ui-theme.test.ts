import { beforeEach, describe, expect, it } from 'vitest';
import { setTheme } from '@/ui/theme';

const colours = () =>
  [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content);

describe('theme colour', () => {
  beforeEach(() => {
    document.head.innerHTML =
      '<meta name="theme-color" content="#f7f8fa" media="(prefers-color-scheme: light)">' +
      '<meta name="theme-color" content="#131314" media="(prefers-color-scheme: dark)">';
  });

  it('an explicit theme colours the bar for both system schemes', () => {
    setTheme('black');
    expect(colours()).toEqual(['#000000', '#000000']);
    setTheme('light');
    expect(colours()).toEqual(['#f7f8fa', '#f7f8fa']);
  });

  it('auto puts the system defaults back', () => {
    setTheme('black');
    setTheme('auto');
    expect(colours()).toEqual(['#f7f8fa', '#131314']);
  });
});
