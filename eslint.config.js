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
// Records are never removed directly; deleting writes a tombstone (D-006).
const noHardDelete = {
  selector: 'CallExpression[callee.property.name=/^(delete|bulkDelete|clear)$/]',
  message: 'Hard deletes are only allowed in src/data/purge.ts (D-006).',
};

const layer = (name, forbiddenLayers, forbiddenPackages = []) => ({
  files: [`src/${name}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
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
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', noInnerHtml, ...noRawDate] },
  },
  {
    files: ['src/data/**/*.{ts,tsx}'],
    ignores: ['src/data/purge.ts'],
    rules: { 'no-restricted-syntax': ['error', noInnerHtml, ...noRawDate, noHardDelete] },
  },
  layer('core', ['data', 'features', 'ui', 'app'], ['react', 'react-dom', 'dexie']),
  layer('data', ['features', 'ui', 'app'], ['react', 'react-dom']),
  layer('features', ['ui', 'app'], ['dexie']),
  layer('ui', ['data', 'app'], ['dexie']),
);
