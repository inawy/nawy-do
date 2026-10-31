// @vitest-environment node
import { resolve } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// The architecture rules are only worth something if they are seen to fail. Each case lints a
// snippet as if it lived at the given path and checks that the rule fires (or, for the "allowed"
// cases, that it does not).
const eslint = new ESLint();

async function rules(file: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: resolve(file) });
  return (result?.messages ?? []).map((m) => m.ruleId ?? 'parse-error');
}

describe('layering', () => {
  it('core may not import React, Dexie or a higher layer', async () => {
    expect(await rules('src/core/model/x.ts', "import { useState } from 'react';\n")).toContain(
      'no-restricted-imports',
    );
    expect(await rules('src/core/model/x.ts', "import Dexie from 'dexie';\n")).toContain(
      'no-restricted-imports',
    );
    expect(await rules('src/core/model/x.ts', "import { createDb } from '@/data';\n")).toContain(
      'no-restricted-imports',
    );
  });

  it('features may not import ui, data or Dexie; ui may not import data or app (D-024)', async () => {
    expect(await rules('src/features/tasks/x.ts', "import { addTask } from '@/data';\n")).toContain(
      'no-restricted-imports',
    );
    expect(
      await rules('src/features/tasks/x.ts', "import type { NawyDoDb } from '@/data';\n"),
    ).toContain('no-restricted-imports');
    expect(await rules('src/features/tasks/x.ts', "import { App } from '@/ui/shell';\n")).toContain(
      'no-restricted-imports',
    );
    expect(await rules('src/features/tasks/x.ts', "import Dexie from 'dexie';\n")).toContain(
      'no-restricted-imports',
    );
    expect(await rules('src/ui/tasks/x.tsx', "import { addTask } from '@/data';\n")).toContain(
      'no-restricted-imports',
    );
  });

  it('allows the normal direction', async () => {
    expect(
      await rules(
        'src/ui/tasks/x.ts',
        "import { groupTasks } from '@/core/model';\nexport const x = groupTasks;\n",
      ),
    ).toEqual([]);
    expect(
      await rules(
        'src/app/x.ts',
        "import { TasksScreen } from '@/ui/shell';\nexport const x = TasksScreen;\n",
      ),
    ).toEqual([]);
    expect(
      await rules(
        'src/features/tasks/x.ts',
        "import type { TaskRepository } from '@/core/ports';\nexport type X = TaskRepository;\n",
      ),
    ).toEqual([]);
    expect(
      await rules(
        'src/app/x.ts',
        "import { createDexieRepositories } from '@/data';\nexport const x = createDexieRepositories;\n",
      ),
    ).toEqual([]);
  });
});

describe('modules are used through their index', () => {
  it('rejects a deep import into a ui or features module', async () => {
    expect(await rules('src/app/x.ts', "import { Nav } from '@/ui/shell/Nav';\n")).toContain(
      'no-restricted-imports',
    );
    expect(
      await rules('src/app/x.ts', "import { useTasks } from '@/features/tasks/useTasks';\n"),
    ).toContain('no-restricted-imports');
  });
});

describe('purity and safety rules', () => {
  it('rejects reading the clock outside app/clock.ts', async () => {
    expect(await rules('src/features/tasks/x.ts', 'export const t = Date.now();\n')).toContain(
      'no-restricted-syntax',
    );
    expect(await rules('src/core/model/x.ts', 'export const t = new Date();\n')).toContain(
      'no-restricted-syntax',
    );
    expect(await rules('src/app/clock.ts', 'export const t = () => Date.now();\n')).toEqual([]);
  });

  it('rejects a hard delete anywhere in src except data/purge.ts', async () => {
    const code =
      'export const f = (db: { tasks: { delete(id: string): void } }) => db.tasks.delete("a");\n';
    for (const file of ['src/data/store.ts', 'src/features/tasks/x.ts', 'src/app/x.ts'])
      expect(await rules(file, code)).toContain('no-restricted-syntax');
    expect(await rules('src/data/purge.ts', code)).toEqual([]);
    const clear = 'export const f = (t: { clear(): void }) => t.clear();\n';
    expect(await rules('src/features/tasks/x.ts', clear)).toContain('no-restricted-syntax');
  });

  it('does not mistake Set.delete for a hard delete', async () => {
    const code = 'export const f = (s: Set<string>) => s.delete("a");\n';
    expect(await rules('src/features/tasks/x.ts', code)).toEqual([]);
  });

  it('rejects a file longer than the size limit', async () => {
    const big = Array.from({ length: 230 }, (_, i) => `export const a${i} = ${i};`).join('\n');
    expect(await rules('src/ui/tasks/x.ts', big + '\n')).toContain('max-lines');
  });

  it('rejects dangerouslySetInnerHTML', async () => {
    const code = 'export const A = () => <div dangerouslySetInnerHTML={{ __html: "x" }} />;\n';
    expect(await rules('src/ui/tasks/x.tsx', code)).toContain('no-restricted-syntax');
  });
});
