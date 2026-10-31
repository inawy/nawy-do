// Flat config. Layering (D-004): core <- data <- features <- ui <- app.
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const noInnerHtml = {
  selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
  message: 'dangerouslySetInnerHTML is forbidden.',
};
// Time comes in as a parameter; no hidden clock reads in src (D-005).
const noRawDate = [
  { selector: "NewExpression[callee.name='Date']", message: 'Pass `now` in instead (D-005).' },
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'Pass `now` in instead (D-005).',
  },
];
// Records are never removed directly; deleting writes a tombstone (D-006). Applies to ALL of src
// (a hook calling `db.tasks.clear()` must fail too), except the two files that purge on purpose.
// `Set.delete` and friends are not matched: only Dexie-shaped calls are.
const noHardDelete = [
  {
    selector: 'CallExpression[callee.property.name=/^(bulkDelete|clear)$/]',
    message: 'Hard deletes are only allowed in src/data/purge.ts and snapshot.ts (D-006).',
  },
  {
    selector:
      "CallExpression[callee.property.name='delete'][callee.object.property.name=/^(tasks|lists|snapshots)$/]",
    message: 'Hard deletes are only allowed in src/data/purge.ts and snapshot.ts (D-006).',
  },
  {
    selector: "CallExpression[callee.object.name='Dexie'][callee.property.name='delete']",
    message: 'Deleting a whole database is forbidden (D-006).',
  },
];

// A module (src/ui/tasks, src/features/tasks, ...) is used only through its index.ts. Inside a
// module, files import each other with relative paths, which this rule does not touch.
const deepImport = {
  group: ['@/ui/*/*', '@/features/*/*'],
  message: 'Import a module through its index.ts, not a file inside it (D-015).',
};

const layer = (name, forbiddenLayers, forbiddenPackages = []) => ({
  files: [`src/${name}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          deepImport,
          ...forbiddenPackages.map((p) => ({
            group: [p, `${p}/**`],
            message: `src/${name} must not import "${p}" (D-004).`,
          })),
          ...forbiddenLayers.map((l) => ({
            group: [`@/${l}`, `@/${l}/**`, `**/${l}`, `**/${l}/**`],
            message: `src/${name} must not import from the "${l}" layer (D-004).`,
          })),
        ],
      },
    ],
  },
});

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/app/clock.ts', 'src/data/purge.ts', 'src/data/snapshot.ts'],
    rules: { 'no-restricted-syntax': ['error', noInnerHtml, ...noRawDate, ...noHardDelete] },
  },
  {
    files: ['src/app/clock.ts'],
    rules: { 'no-restricted-syntax': ['error', noInnerHtml, ...noHardDelete] },
  },
  {
    files: ['src/data/purge.ts', 'src/data/snapshot.ts'],
    rules: { 'no-restricted-syntax': ['error', noInnerHtml, ...noRawDate] },
  },
  // One screen or module that grows past this is doing several jobs: split it (ROADMAP §2.5).
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'max-lines': ['error', { max: 220, skipBlankLines: true, skipComments: true }] },
  },
  layer('core', ['data', 'features', 'ui', 'app'], ['react', 'react-dom', 'dexie']),
  layer('data', ['features', 'ui', 'app'], ['react', 'react-dom']),
  // Dependency inversion (D-024): features see storage only through the ports in core/ports.
  layer('features', ['data', 'ui', 'app'], ['dexie']),
  layer('ui', ['data', 'app'], ['dexie']),
  layer('app', [], []),
);
