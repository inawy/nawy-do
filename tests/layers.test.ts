import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) =>
    statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)],
  );

// A cheap backstop for the lint rule: core must stay pure (D-004, D-005).
describe('core purity', () => {
  it('imports no framework, database, or higher layer, and reads no clock', () => {
    for (const f of files('src/core')) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/from ['"](react|react-dom|dexie)/);
      expect(src, f).not.toMatch(/from ['"]@\/(data|features|ui|app)/);
      expect(src, f).not.toMatch(/new Date\(|Date\.now\(/);
    }
  });
});
