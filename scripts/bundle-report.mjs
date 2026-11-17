// Where the first-load JavaScript comes from: per package and per app folder, in approximate gzip
// kB. Reads the source maps of a build made with `--sourcemap` into another folder, so the real
// dist/ never carries maps. No dependencies: the maps' VLQ mappings are decoded here.
//   vite build --sourcemap --outDir /tmp/report && node scripts/bundle-report.mjs /tmp/report
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const root = process.argv[2] ?? 'dist';
const dir = join(root, 'assets');
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function* segments(mappings) {
  let src = 0;
  let line = 0;
  for (const part of mappings.split(';')) {
    let col = 0;
    for (const seg of part.split(',')) {
      if (!seg) continue;
      const nums = [];
      let value = 0;
      let shift = 0;
      for (const ch of seg) {
        const digit = B64.indexOf(ch);
        value += (digit & 31) << shift;
        if (digit & 32) shift += 5;
        else {
          nums.push(value & 1 ? -(value >> 1) : value >> 1);
          value = 0;
          shift = 0;
        }
      }
      col += nums[0];
      if (nums.length > 1) src += nums[1];
      yield { line, col, src: nums.length > 1 ? src : -1 };
    }
    line += 1;
  }
}

const group = (path) => {
  const m = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/.exec(path);
  if (m) return m[1];
  const a = /src\/([^/]+)(?:\/([^/]+))?/.exec(path);
  return a ? `app: ${a[1]}${a[2] && !a[2].includes('.') ? `/${a[2]}` : ''}` : path;
};

const totals = new Map();
let all = 0;
let allGzip = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const code = readFileSync(join(dir, file), 'utf8');
  const map = JSON.parse(readFileSync(join(dir, `${file}.map`), 'utf8'));
  const lines = code.split('\n');
  const gz = gzipSync(code).length;
  allGzip += gz;
  all += code.length;
  const bySrc = new Map();
  const segs = [...segments(map.mappings)];
  segs.forEach((s, i) => {
    const next = segs[i + 1];
    const end = next && next.line === s.line ? next.col : (lines[s.line] ?? '').length;
    const name = s.src < 0 ? '(unmapped)' : group(map.sources[s.src]);
    bySrc.set(name, (bySrc.get(name) ?? 0) + Math.max(0, end - s.col));
  });
  const mapped = [...bySrc.values()].reduce((a, b) => a + b, 0) || 1;
  for (const [name, bytes] of bySrc) {
    // Spread the file's gzip size over its sources by their share of the minified bytes.
    totals.set(name, (totals.get(name) ?? 0) + (gz * bytes) / mapped);
  }
}
console.log(
  `all JS: ${(allGzip / 1024).toFixed(1)} kB gzip, ${(all / 1024).toFixed(0)} kB minified\n`,
);
for (const [name, gz] of [...totals].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`${(gz / 1024).toFixed(1).padStart(6)} kB  ${name}`);
}
