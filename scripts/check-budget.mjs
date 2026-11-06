// Fails the build when what a first visit downloads grows past its budget. Sizes are gzip, the
// way they travel. Run after `vite build`. Raise a limit on purpose, with a reason, never to
// make a red build green.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const BUDGET_KB = { js: 160, css: 8, total: 180 }; // today: ~136 / ~5.4 / ~142 (D-039)
const dir = 'dist/assets';
const sizes = { js: 0, css: 0 };
for (const file of readdirSync(dir)) {
  const kind = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : undefined;
  if (kind) sizes[kind] += gzipSync(readFileSync(join(dir, file))).length / 1024;
}
sizes.total = sizes.js + sizes.css + gzipSync(readFileSync('dist/index.html')).length / 1024;

let failed = false;
for (const [name, limit] of Object.entries(BUDGET_KB)) {
  const size = sizes[name];
  const ok = size <= limit;
  failed ||= !ok;
  console.log(
    `${ok ? 'ok  ' : 'OVER'} ${name.padEnd(5)} ${size.toFixed(1)} kB gzip (limit ${limit})`,
  );
}
if (failed) {
  console.error(
    '::error title=bundle budget::the app got heavier than its budget (see scripts/check-budget.mjs)',
  );
  process.exit(1);
}
