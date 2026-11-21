// Fails the build when what a first visit downloads grows past its budget. Sizes are gzip, the
// way they travel. Run after `vite build`. Raise a limit on purpose, with a reason, never to
// make a red build green.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

// D-039 set 160 / 8 / 180 at ~136 / ~5.4 / ~142. The offline-parity round (D-0043: smart add, trash,
// import, export, calendar file, alerts, repeat end and lead time) brought it to ~160 / ~7 / ~168,
// so js is raised to 170 and total to 190 on purpose. Next saving to make is lazy-loading the
// rarely used sheets (trash, export, data) rather than raising this again.
// The Android app (ADR 0045, 0046) adds the web fallbacks of its Capacitor plugins as lazy chunks
// (~5 kB gzip, used only inside the app, never on the first screen): js goes to 178 on purpose,
// `critical` is unchanged. Next saving: keep those chunks out of the browser's precache.
// `critical` is what the first screen loads: the scripts index.html names (entry and the chunks
// it preloads). Rarely opened sheets load on first use, so they count in `js` but not here.
const BUDGET_KB = { critical: 160, js: 178, css: 8, total: 192 };
const dir = 'dist/assets';
const sizes = { js: 0, css: 0 };
for (const file of readdirSync(dir)) {
  const kind = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : undefined;
  if (kind) sizes[kind] += gzipSync(readFileSync(join(dir, file))).length / 1024;
}
const html = readFileSync('dist/index.html', 'utf8');
const named = new Set([...html.matchAll(/assets\/([^"']+\.js)/g)].map((m) => m[1]));
sizes.critical = 0;
for (const file of named) sizes.critical += gzipSync(readFileSync(join(dir, file))).length / 1024;
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
