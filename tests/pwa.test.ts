import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The manifest is generated at build time from vite.config.ts; these checks keep its inputs honest.
describe('PWA inputs', () => {
  const config = readFileSync('vite.config.ts', 'utf8');
  it('ships the icons the manifest names', () => {
    for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) {
      expect(config).toContain(`icons/${f}`);
      expect(() => readFileSync(`public/icons/${f}`)).not.toThrow();
    }
  });
  it('is relative, so it works at the domain root and under a sub-path', () => {
    expect(config).toContain("start_url: './'");
    expect(config).toContain("scope: './'");
    expect(config).toContain("base: './'");
  });
  it('never reloads silently', () => {
    expect(config).toContain("registerType: 'prompt'");
  });
});
